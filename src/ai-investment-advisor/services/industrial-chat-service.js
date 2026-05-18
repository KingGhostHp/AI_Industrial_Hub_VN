/**
 * IndustrialChatService
 *
 * Browser-safe structured assistant for KCN/CCN questions. Phase 1 is intentionally
 * deterministic: it uses existing GeoJSON data and logistics/scoring services,
 * avoids external LLM calls, and refuses to invent missing policy/legal details.
 */

const INDUSTRY_ALIASES = {
  logistics: ['logistics', 'kho vận', 'cảng', 'vận tải', 'chuỗi cung ứng'],
  electronics: ['điện tử', 'linh kiện', 'bán dẫn', 'semiconductor', 'electronics'],
  food_processing: ['thực phẩm', 'chế biến', 'food'],
  textiles: ['dệt', 'may', 'textile', 'garment'],
  technology: ['công nghệ', 'phần mềm', 'technology', 'tech'],
  manufacturing: ['sản xuất', 'chế tạo', 'nhà máy', 'manufacturing']
};

const INDUSTRY_LABELS = {
  manufacturing: 'sản xuất chế tạo',
  logistics: 'logistics/kho vận',
  technology: 'công nghệ',
  food_processing: 'chế biến thực phẩm',
  textiles: 'dệt may',
  electronics: 'điện tử/linh kiện'
};

const SOUTHERN_PROVINCES = ['Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa', 'Tây Ninh', 'Cần Thơ', 'Tiền Giang', 'Vĩnh Long', 'An Giang', 'Đồng Tháp'];
const NORTHERN_PROVINCES = ['Hà Nội', 'Bắc Ninh', 'Hải Phòng', 'Hải Dương', 'Hưng Yên', 'Vĩnh Phúc', 'Thái Nguyên', 'Quảng Ninh', 'Bắc Giang'];
const CENTRAL_PROVINCES = ['Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Thừa Thiên', 'Nghệ An', 'Thanh Hóa', 'Bình Định', 'Khánh Hòa'];

export class IndustrialChatService {
  constructor(options = {}) {
    this.dataManager = options.dataManager;
    this.logisticsCalculator = options.logisticsCalculator;
    this.maxResults = options.maxResults || 5;
  }

  async ask(message, context = {}) {
    const query = this._normalize(message);
    const zones = await this._getZones();

    if (!query) {
      return this._text('Bạn muốn tìm hiểu về KCN/CCN, tỉnh thành, logistics hay chi phí đầu tư?');
    }

    if (this._isPolicyQuestion(query)) {
      return this._text('Hiện chatbot Phase 1 chưa có kho tài liệu chính sách/quy hoạch để trích dẫn. Mình không bịa thông tin pháp lý; phần này nên đưa vào Phase 2 RAG có nguồn/citation.');
    }

    if (this._includesAny(query, ['so sánh', 'compare', 'khác nhau'])) {
      return this._compareProvinces(query, zones);
    }

    if (this._includesAny(query, ['logistics', 'gần cảng', 'cảng biển', 'sân bay', 'kho vận'])) {
      return this._findLogisticsZones(query, zones);
    }

    if (this._includesAny(query, ['giá thấp', 'rẻ', 'ngân sách', 'chi phí thấp', 'giá thuê'])) {
      return this._findCheapZones(query, zones);
    }

    if (this._includesAny(query, ['ở ', 'tại ', 'thuộc ', 'danh sách']) || this._extractProvinceNames(query, zones).length > 0) {
      const provinceResult = this._findZonesByProvince(query, zones);
      if (provinceResult) return provinceResult;
    }

    const industry = this._detectIndustry(query);
    if (industry || this._includesAny(query, ['phù hợp', 'nên chọn', 'đầu tư', 'recommend', 'tư vấn'])) {
      return this._recommendByIndustry(query, zones, industry || 'manufacturing');
    }

    if (context.selectedZone) {
      return this._explainZone(context.selectedZone);
    }

    return this._text(
      'Mình có thể hỗ trợ: tìm KCN theo tỉnh, tìm khu gần cảng/sân bay, so sánh tỉnh, tìm khu giá thấp, hoặc gợi ý KCN theo ngành. Ví dụ: “KCN nào gần cảng nhất?”'
    );
  }

  async _getZones() {
    if (!this.dataManager?.loadZoneData) return [];
    const data = await this.dataManager.loadZoneData();
    return data?.features || [];
  }

  _findZonesByProvince(query, zones) {
    const provinces = this._extractProvinceNames(query, zones);
    if (provinces.length === 0) return null;

    const matched = zones.filter(zone => {
      const province = this._getProvince(zone);
      return provinces.some(p => this._normalize(province).includes(this._normalize(p)) || this._normalize(p).includes(this._normalize(province)));
    });

    if (matched.length === 0) {
      return this._text(`Hiện hệ thống chưa tìm thấy KCN/CCN phù hợp tại ${provinces.join(', ')} trong dữ liệu đang tải.`);
    }

    const top = matched.slice(0, this.maxResults);
    return {
      type: 'zone-list',
      answer: `Tìm thấy ${matched.length} KCN/CCN tại ${provinces.join(', ')}. Dưới đây là ${top.length} khu đầu tiên trong dữ liệu hiện có:`,
      items: top.map(zone => this._zoneCard(zone)),
      suggestions: ['KCN nào gần cảng nhất?', `So sánh ${provinces[0]} với Hải Phòng`]
    };
  }

  _findCheapZones(query, zones) {
    const provinceNames = this._extractProvinceNames(query, zones);
    const regionZones = this._filterByRegion(query, zones);
    const baseZones = provinceNames.length > 0
      ? zones.filter(z => provinceNames.some(p => this._normalize(this._getProvince(z)).includes(this._normalize(p))))
      : regionZones;

    const priced = baseZones
      .map(zone => ({ zone, price: this._parseNumber(zone.properties?.price) }))
      .filter(item => Number.isFinite(item.price) && item.price > 0)
      .sort((a, b) => a.price - b.price);

    if (priced.length === 0) {
      return this._text('Hiện dữ liệu giá thuê chưa đủ để xếp hạng chính xác. Bạn có thể hỏi theo tỉnh hoặc theo logistics để mình lọc bằng dữ liệu khác.');
    }

    const top = priced.slice(0, this.maxResults);
    return {
      type: 'zone-list',
      answer: `Các KCN/CCN có giá thuê thấp nhất trong phạm vi dữ liệu phù hợp. Lưu ý: giá có thể thiếu đơn vị hoặc chưa cập nhật tùy nguồn dữ liệu.`,
      items: top.map(({ zone, price }) => this._zoneCard(zone, `Giá ghi nhận: ${price}`)),
      suggestions: ['Tìm KCN gần cảng biển', 'Tư vấn cho ngành sản xuất']
    };
  }

  _findLogisticsZones(query, zones) {
    const locationType = this._includesAny(query, ['sân bay', 'airport']) ? 'airport' : 'port';
    const baseZones = this._filterByRegion(query, zones);

    const ranked = baseZones.map(zone => {
      try {
        const nearest = this.logisticsCalculator?.findNearestLocations?.(zone, locationType, 1)?.[0];
        return { zone, nearest, distance: nearest?.distance ?? Infinity };
      } catch {
        return { zone, nearest: null, distance: Infinity };
      }
    }).filter(item => Number.isFinite(item.distance)).sort((a, b) => a.distance - b.distance);

    if (ranked.length === 0) {
      return this._text('Hiện chưa đủ dữ liệu cảng/sân bay hoặc tọa độ để tính khoảng cách logistics.');
    }

    const label = locationType === 'airport' ? 'sân bay' : 'cảng biển';
    const top = ranked.slice(0, this.maxResults);
    return {
      type: 'zone-list',
      answer: `Dựa trên khoảng cách đường chim bay tới ${label} gần nhất, đây là các KCN/CCN có lợi thế logistics tốt nhất:`,
      items: top.map(({ zone, nearest, distance }) => this._zoneCard(zone, `Gần ${nearest?.name || label}: ${distance.toFixed(1)} km`)),
      suggestions: ['So sánh Bắc Ninh và Hải Phòng', 'KCN giá thấp ở miền Nam']
    };
  }

  _recommendByIndustry(query, zones, industry) {
    const baseZones = this._filterByRegion(query, zones);
    const weights = this._weightsForIndustry(industry);
    const ranked = baseZones.map(zone => {
      const price = this._parseNumber(zone.properties?.price);
      const priceScore = Number.isFinite(price) && price > 0 ? Math.max(0, Math.min(100, 100 - price / 3)) : 55;
      let logisticsScore = 50;
      try { logisticsScore = this.logisticsCalculator?.calculateLogisticsScore?.(zone) ?? 50; } catch { /* keep fallback */ }
      const acreage = this._parseNumber(zone.properties?.acreage);
      const infrastructureScore = Number.isFinite(acreage) ? Math.max(35, Math.min(100, acreage / 10)) : 55;
      const locationScore = this._provinceScore(this._getProvince(zone));
      const total = priceScore * weights.price + logisticsScore * weights.logistics + infrastructureScore * weights.infrastructure + locationScore * weights.location;
      return { zone, score: total, priceScore, logisticsScore, infrastructureScore, locationScore };
    }).sort((a, b) => b.score - a.score).slice(0, this.maxResults);

    return {
      type: 'zone-list',
      answer: `Với ngành ${INDUSTRY_LABELS[industry] || 'sản xuất'}, mình ưu tiên ${this._industryReason(industry)}. Đây là các lựa chọn nổi bật theo dữ liệu hiện có:`,
      items: ranked.map(item => this._zoneCard(item.zone, `Điểm gợi ý: ${Math.round(item.score)}/100 · Logistics ${Math.round(item.logisticsScore)} · Hạ tầng ${Math.round(item.infrastructureScore)}`)),
      suggestions: ['Tìm khu gần cảng nhất', 'KCN nào có giá thuê thấp?']
    };
  }

  _compareProvinces(query, zones) {
    const provinces = this._extractProvinceNames(query, zones).slice(0, 2);
    if (provinces.length < 2) {
      return this._text('Bạn muốn so sánh hai tỉnh nào? Ví dụ: “So sánh Bắc Ninh và Hải Phòng”.');
    }

    const stats = provinces.map(name => {
      const provinceZones = zones.filter(z => this._normalize(this._getProvince(z)).includes(this._normalize(name)));
      const prices = provinceZones.map(z => this._parseNumber(z.properties?.price)).filter(n => Number.isFinite(n) && n > 0);
      const acreages = provinceZones.map(z => this._parseNumber(z.properties?.acreage)).filter(n => Number.isFinite(n) && n > 0);
      return {
        name,
        count: provinceZones.length,
        avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
        totalAcreage: acreages.reduce((a, b) => a + b, 0),
        sample: provinceZones.slice(0, 3).map(z => this._getName(z))
      };
    });

    const lines = stats.map(s => `• ${s.name}: ${s.count} KCN/CCN${s.avgPrice ? `, giá TB khoảng ${s.avgPrice.toFixed(1)}` : ''}${s.totalAcreage ? `, tổng diện tích ghi nhận ${s.totalAcreage.toFixed(0)} ha` : ''}.`).join('\n');
    return {
      type: 'comparison',
      answer: `So sánh nhanh theo dữ liệu hiện có:\n${lines}\n\nGợi ý: tỉnh có nhiều khu hơn thường có nhiều lựa chọn, còn quyết định cuối nên xét thêm ngành, ngân sách và logistics.`,
      items: [],
      suggestions: [`KCN nào ở ${provinces[0]}?`, `KCN nào ở ${provinces[1]}?`]
    };
  }

  _explainZone(zone) {
    const props = zone.properties || {};
    return this._text(`${props.name || 'KCN/CCN này'} thuộc ${this._getProvince(zone) || 'chưa rõ tỉnh'}. Mình có thể phân tích sâu hơn nếu bạn hỏi về logistics, giá thuê, hoặc mức phù hợp theo ngành.`);
  }

  _zoneCard(zone, note = '') {
    const props = zone.properties || {};
    return {
      title: this._getName(zone),
      subtitle: this._getProvince(zone),
      price: props.price || props.gia || '',
      acreage: props.acreage || props.dientich || props.area || '',
      note,
      feature: zone
    };
  }

  _filterByRegion(query, zones) {
    let provinces = null;
    if (this._includesAny(query, ['miền nam', 'phía nam'])) provinces = SOUTHERN_PROVINCES;
    if (this._includesAny(query, ['miền bắc', 'phía bắc'])) provinces = NORTHERN_PROVINCES;
    if (this._includesAny(query, ['miền trung', 'trung bộ'])) provinces = CENTRAL_PROVINCES;
    if (!provinces) return zones;
    return zones.filter(z => provinces.some(p => this._normalize(this._getProvince(z)).includes(this._normalize(p))));
  }

  _extractProvinceNames(query, zones) {
    const provinceSet = new Set(zones.map(z => this._getProvince(z)).filter(Boolean));
    return Array.from(provinceSet).filter(name => this._normalize(query).includes(this._normalize(name)));
  }

  _detectIndustry(query) {
    return Object.entries(INDUSTRY_ALIASES).find(([, aliases]) => this._includesAny(query, aliases))?.[0] || null;
  }

  _weightsForIndustry(industry) {
    const base = {
      manufacturing: { price: 0.25, location: 0.2, infrastructure: 0.35, logistics: 0.2 },
      logistics: { price: 0.15, location: 0.2, infrastructure: 0.2, logistics: 0.45 },
      electronics: { price: 0.15, location: 0.3, infrastructure: 0.35, logistics: 0.2 },
      food_processing: { price: 0.25, location: 0.15, infrastructure: 0.25, logistics: 0.35 },
      textiles: { price: 0.35, location: 0.2, infrastructure: 0.25, logistics: 0.2 },
      technology: { price: 0.15, location: 0.35, infrastructure: 0.35, logistics: 0.15 }
    };
    return base[industry] || base.manufacturing;
  }

  _industryReason(industry) {
    const reasons = {
      logistics: 'khoảng cách tới cảng/sân bay và khả năng kết nối vận tải',
      electronics: 'hạ tầng, vị trí tại tỉnh công nghiệp phát triển và kết nối logistics ổn định',
      food_processing: 'logistics lạnh/đầu ra thị trường và chi phí thuê hợp lý',
      textiles: 'chi phí thuê, quy mô mặt bằng và khả năng tiếp cận lao động',
      technology: 'vị trí, chất lượng hạ tầng và hệ sinh thái công nghiệp',
      manufacturing: 'quy mô hạ tầng, chi phí và vị trí cân bằng'
    };
    return reasons[industry] || reasons.manufacturing;
  }

  _provinceScore(province = '') {
    if (NORTHERN_PROVINCES.some(p => this._normalize(province).includes(this._normalize(p)))) return 75;
    if (SOUTHERN_PROVINCES.some(p => this._normalize(province).includes(this._normalize(p)))) return 78;
    if (CENTRAL_PROVINCES.some(p => this._normalize(province).includes(this._normalize(p)))) return 62;
    return 55;
  }

  _isPolicyQuestion(query) {
    return this._includesAny(query, ['thuế', 'ưu đãi', 'pháp lý', 'quy hoạch', 'nghị định', 'giấy phép', 'chính sách']);
  }

  _text(answer) {
    return { type: 'text', answer, items: [], suggestions: ['Tìm KCN gần cảng biển', 'So sánh Bắc Ninh và Hải Phòng'] };
  }

  _getName(zone) {
    const p = zone.properties || {};
    return p.name || p.ten || p.Name || 'Không rõ tên';
  }

  _getProvince(zone) {
    const p = zone.properties || {};
    return p.province || p.tinh || p.Tinh || p['Tỉnh/TP'] || '';
  }

  _parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return NaN;
    const match = String(value).replace(',', '.').match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  _includesAny(query, terms) {
    const normalized = this._normalize(query);
    return terms.some(term => normalized.includes(this._normalize(term)));
  }

  _normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  }
}

export default IndustrialChatService;
