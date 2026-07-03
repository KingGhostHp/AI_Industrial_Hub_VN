/**
 * IndustrialChatbot
 *
 * Floating assistant UI for the AI Investment Advisor dashboard. The component is
 * self-contained and uses a structured chat service so Phase 1 works without a
 * backend or exposed LLM API key.
 */

export class IndustrialChatbot {
  constructor(options = {}) {
    this.chatService = options.chatService;
    this.onFocusZone = options.onFocusZone || (() => {});
    this.onOpenAnalytics = options.onOpenAnalytics || (() => {});
    this.messages = [];
    this.isOpen = false;
    this.isBusy = false;
    this.contextProvider = options.contextProvider || (() => ({}));
    this.quickPrompts = [
      'KCN nào phù hợp cho ngành logistics?',
      'KCN nào gần cảng biển nhất?',
      'So sánh Bắc Ninh và Hải Phòng',
      'KCN nào có giá thuê thấp?',
      'Tìm KCN ở Bình Dương'
    ];
  }

  mount() {
    this._ensureStyles();
    this.root = document.createElement('div');
    this.root.id = 'industrial-chatbot-root';
    document.body.appendChild(this.root);
    this.render();
  }

  render() {
    if (!this.root) return;
    this.root.innerHTML = `
      <button id="industrial-chatbot-launcher" class="industrial-chatbot-launcher ${this.isOpen ? 'is-open' : ''}" aria-label="Mở chatbot KCN">
        <span class="industrial-chatbot-pulse"></span>
        <span class="industrial-chatbot-launcher-icon">${this.isOpen ? '×' : '💬'}</span>
      </button>
      <section class="industrial-chatbot-panel ${this.isOpen ? 'is-open' : ''}" aria-live="polite">
        <header class="industrial-chatbot-header">
          <div>
            <div class="industrial-chatbot-kicker">AI Industrial Assistant</div>
            <h3>Trợ lý KCN/CCN</h3>
            <p>Hỏi về khu công nghiệp, logistics, chi phí và lựa chọn đầu tư</p>
          </div>
          <button id="industrial-chatbot-close" class="industrial-chatbot-close" aria-label="Đóng chatbot">×</button>
        </header>
        <div id="industrial-chatbot-messages" class="industrial-chatbot-messages">
          ${this._renderMessages()}
        </div>
        <div class="industrial-chatbot-prompts ${this.messages.length ? 'is-compact' : ''}">
          ${this.quickPrompts.map(prompt => `<button class="industrial-chatbot-prompt" data-prompt="${this._escape(prompt)}">${this._escape(prompt)}</button>`).join('')}
        </div>
        <form id="industrial-chatbot-form" class="industrial-chatbot-form">
          <input id="industrial-chatbot-input" type="text" autocomplete="off" placeholder="Ví dụ: KCN nào gần cảng nhất?" ${this.isBusy ? 'disabled' : ''} />
          <button type="submit" ${this.isBusy ? 'disabled' : ''}>Gửi</button>
        </form>
      </section>
    `;
    this._attachListeners();
    this._scrollToBottom();
  }

  _renderMessages() {
    if (!this.messages.length) {
      return `
        <div class="industrial-chatbot-empty">
          <div class="industrial-chatbot-orb">🏭</div>
          <strong>Bạn cần tìm KCN phù hợp?</strong>
          <span>Mình có thể lọc theo tỉnh, logistics, chi phí và ngành đầu tư bằng dữ liệu hiện có.</span>
        </div>
      `;
    }

    return this.messages.map((message, index) => {
      if (message.role === 'user') {
        return `<div class="industrial-chatbot-message user"><div>${this._escape(message.content)}</div></div>`;
      }

      return `
        <div class="industrial-chatbot-message assistant">
          <div class="industrial-chatbot-answer">${this._formatAnswer(message.content.answer)}</div>
          ${this._renderItems(message.content.items || [], index)}
          ${this._renderSuggestions(message.content.suggestions || [])}
        </div>
      `;
    }).join('') + (this.isBusy ? '<div class="industrial-chatbot-typing"><span></span><span></span><span></span></div>' : '');
  }

  _renderItems(items, messageIndex) {
    if (!items.length) return '';
    return `<div class="industrial-chatbot-cards">
      ${items.map((item, itemIndex) => `
        <article class="industrial-chatbot-card">
          <div class="industrial-chatbot-card-main">
            <strong>${this._escape(item.title)}</strong>
            <span>📍 ${this._escape(item.subtitle || 'Chưa rõ tỉnh')}</span>
            <small>${[item.acreage ? `📏 ${this._escape(item.acreage)} ha` : '', item.price ? `💰 ${this._escape(item.price)}` : ''].filter(Boolean).join(' · ')}</small>
            ${item.note ? `<em>${this._escape(item.note)}</em>` : ''}
          </div>
          <button class="industrial-chatbot-map-action" data-message-index="${messageIndex}" data-item-index="${itemIndex}">Xem trên bản đồ</button>
        </article>
      `).join('')}
    </div>`;
  }

  _renderSuggestions(suggestions) {
    if (!suggestions.length) return '';
    return `<div class="industrial-chatbot-followups">
      ${suggestions.slice(0, 3).map(suggestion => `<button class="industrial-chatbot-followup" data-prompt="${this._escape(suggestion)}">${this._escape(suggestion)}</button>`).join('')}
      <button class="industrial-chatbot-followup analytics" data-analytics="true">📊 Mở thống kê</button>
    </div>`;
  }

  _attachListeners() {
    document.getElementById('industrial-chatbot-launcher')?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.render();
    });
    document.getElementById('industrial-chatbot-close')?.addEventListener('click', () => {
      this.isOpen = false;
      this.render();
    });
    document.getElementById('industrial-chatbot-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('industrial-chatbot-input');
      const value = input?.value?.trim();
      if (value) this.send(value);
    });
    this.root.querySelectorAll('[data-prompt]').forEach(button => {
      button.addEventListener('click', () => this.send(button.dataset.prompt));
    });
    this.root.querySelectorAll('[data-analytics]').forEach(button => {
      button.addEventListener('click', () => this.onOpenAnalytics());
    });
    this.root.querySelectorAll('.industrial-chatbot-map-action').forEach(button => {
      button.addEventListener('click', () => {
        const message = this.messages[Number(button.dataset.messageIndex)];
        const item = message?.content?.items?.[Number(button.dataset.itemIndex)];
        if (item?.feature) this.onFocusZone(item.feature);
      });
    });
  }

  async send(text) {
    if (this.isBusy || !this.chatService) return;
    this.isOpen = true;
    this.messages.push({ role: 'user', content: text });
    this.isBusy = true;
    this.render();

    try {
      const response = await this.chatService.ask(text, this.contextProvider());
      this.messages.push({ role: 'assistant', content: response });
    } catch (error) {
      console.error('[IndustrialChatbot] Failed to answer:', error);
      this.messages.push({
        role: 'assistant',
        content: {
          type: 'text',
          answer: 'Mình gặp lỗi khi đọc dữ liệu hiện tại. Bạn thử lại sau hoặc kiểm tra console để biết chi tiết.',
          items: []
        }
      });
    } finally {
      this.isBusy = false;
      this.render();
    }
  }

  _formatAnswer(answer = '') {
    return this._escape(answer).replace(/\n/g, '<br>');
  }

  _scrollToBottom() {
    const box = document.getElementById('industrial-chatbot-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  _escape(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _ensureStyles() {
    if (document.getElementById('industrial-chatbot-styles')) return;
    const style = document.createElement('style');
    style.id = 'industrial-chatbot-styles';
    style.textContent = `
      .industrial-chatbot-launcher{position:fixed;right:72px;bottom:28px;z-index:1400;width:58px;height:58px;border:1px solid rgba(255,255,255,.22);border-radius:19px;background:linear-gradient(145deg,#0ea5e9,#6366f1 58%,#8b5cf6);color:#fff;cursor:pointer;font-size:24px;display:grid;place-items:center;transition:transform .22s ease,filter .22s ease}.industrial-chatbot-launcher:hover{transform:translateY(-2px) scale(1.03);filter:saturate(1.12)}.industrial-chatbot-launcher.is-open{border-radius:18px;background:linear-gradient(145deg,#334155,#1e293b)}.industrial-chatbot-pulse{position:absolute;inset:-5px;border-radius:23px;border:1px solid rgba(125,211,252,.35);animation:industrialPulse 2.4s infinite;pointer-events:none}.industrial-chatbot-launcher-icon{position:relative;z-index:1;font-weight:900}.industrial-chatbot-panel{position:fixed;right:72px;bottom:98px;z-index:1399;width:min(430px,calc(100vw - 34px));max-height:min(700px,calc(100vh - 132px));display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(148,163,184,.26);border-radius:28px;background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(15,23,42,.92));backdrop-filter:blur(22px);opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .22s ease,transform .22s ease}.industrial-chatbot-panel.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}.industrial-chatbot-header{display:flex;justify-content:space-between;gap:16px;padding:20px 20px 18px;background:linear-gradient(135deg,rgba(14,165,233,.22),rgba(99,102,241,.2) 52%,rgba(139,92,246,.18));border-bottom:1px solid rgba(148,163,184,.18);color:#fff}.industrial-chatbot-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.18em;color:#67e8f9;font-weight:900}.industrial-chatbot-header h3{margin:5px 0 6px;font-size:22px;line-height:1;font-weight:900;letter-spacing:-.04em}.industrial-chatbot-header p{margin:0;color:rgba(226,232,240,.76);font-size:13px;line-height:1.45}.industrial-chatbot-close{flex:0 0 auto;width:40px;height:40px;border-radius:15px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:22px;line-height:1;transition:background .2s ease,transform .2s ease}.industrial-chatbot-close:hover{background:rgba(255,255,255,.14);transform:rotate(90deg)}.industrial-chatbot-messages{padding:18px 18px 14px;overflow-y:auto;overflow-x:hidden;min-height:250px;max-height:420px;color:#e5e7eb;scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.55) transparent}.industrial-chatbot-messages::-webkit-scrollbar{width:7px}.industrial-chatbot-messages::-webkit-scrollbar-track{background:transparent}.industrial-chatbot-messages::-webkit-scrollbar-thumb{background:rgba(148,163,184,.45);border-radius:999px}.industrial-chatbot-empty{min-height:228px;display:grid;place-items:center;text-align:center;gap:10px;color:rgba(226,232,240,.78);font-size:13px}.industrial-chatbot-orb{width:70px;height:70px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,rgba(34,211,238,.22),rgba(99,102,241,.2));border:1px solid rgba(148,163,184,.22);font-size:31px}.industrial-chatbot-empty strong{color:#fff;font-size:16px}.industrial-chatbot-empty span{max-width:300px;line-height:1.55}.industrial-chatbot-message{display:flex;margin-bottom:14px;min-width:0}.industrial-chatbot-message.user{justify-content:flex-end}.industrial-chatbot-message.user>div{max-width:84%;padding:12px 15px;border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:13px;line-height:1.48;border:1px solid rgba(255,255,255,.14);overflow-wrap:anywhere}.industrial-chatbot-message.assistant{display:block}.industrial-chatbot-answer{display:block;max-width:100%;padding:14px 16px;border-radius:18px;background:rgba(30,41,59,.78);border:1px solid rgba(148,163,184,.22);font-size:13.5px;line-height:1.62;color:#f8fafc;overflow-wrap:anywhere}.industrial-chatbot-cards{display:grid;gap:10px;margin-top:11px}.industrial-chatbot-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px;border-radius:18px;background:rgba(15,23,42,.7);border:1px solid rgba(148,163,184,.22)}.industrial-chatbot-card-main{display:grid;gap:4px;min-width:0}.industrial-chatbot-card strong{font-size:13.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.industrial-chatbot-card span,.industrial-chatbot-card small{font-size:11.5px;color:rgba(226,232,240,.68);line-height:1.35}.industrial-chatbot-card em{font-style:normal;font-size:11.5px;color:#a7f3d0;line-height:1.35}.industrial-chatbot-map-action{align-self:center;white-space:nowrap;border-radius:12px;padding:8px 10px;background:rgba(14,165,233,.12);color:#7dd3fc;border:1px solid rgba(125,211,252,.28);font-size:11px;font-weight:850;cursor:pointer;transition:background .2s ease,color .2s ease}.industrial-chatbot-map-action:hover{background:rgba(14,165,233,.2);color:#e0f2fe}.industrial-chatbot-prompts{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:2px 18px 13px;scrollbar-width:none}.industrial-chatbot-prompts::-webkit-scrollbar{display:none}.industrial-chatbot-prompts.is-compact{padding-top:0}.industrial-chatbot-prompt,.industrial-chatbot-followup{border:1px solid rgba(148,163,184,.25);background:rgba(51,65,85,.58);color:#e0f2fe;border-radius:999px;padding:8px 11px;font-size:11.5px;white-space:nowrap;cursor:pointer;transition:background .2s ease,border-color .2s ease}.industrial-chatbot-prompt:hover,.industrial-chatbot-followup:hover{background:rgba(71,85,105,.72);border-color:rgba(125,211,252,.32)}.industrial-chatbot-followups{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;max-width:100%;overflow:hidden}.industrial-chatbot-followup.analytics{color:#c4b5fd}.industrial-chatbot-form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:14px;border-top:1px solid rgba(148,163,184,.18);background:rgba(2,6,23,.38)}.industrial-chatbot-form input{width:100%;min-width:0;border:1px solid rgba(148,163,184,.18);border-radius:17px;background:rgba(30,41,59,.74);color:#fff;padding:13px 14px;outline:none;font-size:13px}.industrial-chatbot-form input::placeholder{color:rgba(203,213,225,.54)}.industrial-chatbot-form input:focus{border-color:rgba(125,211,252,.52);background:rgba(30,41,59,.9)}.industrial-chatbot-form button{border:1px solid rgba(255,255,255,.16);border-radius:17px;padding:0 18px;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;font-weight:900;cursor:pointer}.industrial-chatbot-form button:disabled,.industrial-chatbot-form input:disabled{opacity:.6;cursor:not-allowed}.industrial-chatbot-typing{display:flex;gap:5px;align-items:center;padding:12px 14px;width:max-content;border-radius:17px;background:rgba(30,41,59,.78);border:1px solid rgba(148,163,184,.18)}.industrial-chatbot-typing span{width:7px;height:7px;border-radius:999px;background:#67e8f9;animation:industrialTyping 1s infinite ease-in-out}.industrial-chatbot-typing span:nth-child(2){animation-delay:.15s}.industrial-chatbot-typing span:nth-child(3){animation-delay:.3s}@keyframes industrialPulse{0%,100%{transform:scale(.94);opacity:.5}50%{transform:scale(1.1);opacity:.1}}@keyframes industrialTyping{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}@media(max-width:680px){.industrial-chatbot-launcher{right:64px;bottom:26px;width:54px;height:54px}.industrial-chatbot-panel{right:12px;left:12px;bottom:92px;width:auto;max-height:calc(100vh - 114px);border-radius:24px}.industrial-chatbot-header{padding:17px}.industrial-chatbot-header h3{font-size:20px}.industrial-chatbot-card{grid-template-columns:1fr}.industrial-chatbot-map-action{justify-self:start}.industrial-chatbot-form{padding:12px}.industrial-chatbot-form button{padding:0 14px}}
    `;
    document.head.appendChild(style);
  }
}

export default IndustrialChatbot;
