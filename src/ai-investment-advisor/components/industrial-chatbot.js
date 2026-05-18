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
      .industrial-chatbot-launcher{position:fixed;right:96px;bottom:24px;z-index:1400;width:58px;height:58px;border:none;border-radius:20px;background:linear-gradient(135deg,#22d3ee,#6366f1 55%,#a855f7);color:#fff;box-shadow:0 20px 55px rgba(37,99,235,.38), inset 0 1px 0 rgba(255,255,255,.35);cursor:pointer;font-size:24px;display:grid;place-items:center;transition:transform .25s ease,box-shadow .25s ease}.industrial-chatbot-launcher:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 28px 70px rgba(99,102,241,.48)}.industrial-chatbot-launcher.is-open{border-radius:18px}.industrial-chatbot-pulse{position:absolute;inset:-7px;border-radius:24px;background:rgba(34,211,238,.18);animation:industrialPulse 2.4s infinite}.industrial-chatbot-launcher-icon{position:relative;z-index:1;font-weight:900}.industrial-chatbot-panel{position:fixed;right:96px;bottom:94px;z-index:1399;width:min(410px,calc(100vw - 34px));max-height:min(720px,calc(100vh - 130px));display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:linear-gradient(180deg,rgba(15,23,42,.92),rgba(15,23,42,.78));box-shadow:0 30px 90px rgba(2,6,23,.55);backdrop-filter:blur(22px);opacity:0;transform:translateY(20px) scale(.96);pointer-events:none;transition:opacity .25s ease,transform .25s ease}.industrial-chatbot-panel.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}.industrial-chatbot-header{display:flex;justify-content:space-between;gap:16px;padding:18px 18px 16px;background:radial-gradient(circle at 10% 0%,rgba(34,211,238,.28),transparent 36%),radial-gradient(circle at 85% 15%,rgba(168,85,247,.24),transparent 34%);border-bottom:1px solid rgba(255,255,255,.1);color:#fff}.industrial-chatbot-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#67e8f9;font-weight:800}.industrial-chatbot-header h3{margin:4px 0 5px;font-size:18px;line-height:1}.industrial-chatbot-header p{margin:0;color:rgba(226,232,240,.72);font-size:12px;line-height:1.45}.industrial-chatbot-close{width:32px;height:32px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:20px}.industrial-chatbot-messages{padding:16px;overflow-y:auto;min-height:250px;max-height:420px;color:#e5e7eb}.industrial-chatbot-empty{min-height:220px;display:grid;place-items:center;text-align:center;gap:8px;color:rgba(226,232,240,.76);font-size:13px}.industrial-chatbot-orb{width:66px;height:66px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,rgba(34,211,238,.24),rgba(99,102,241,.2));font-size:30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}.industrial-chatbot-empty strong{color:#fff;font-size:15px}.industrial-chatbot-empty span{max-width:290px;line-height:1.5}.industrial-chatbot-message{display:flex;margin-bottom:13px}.industrial-chatbot-message.user{justify-content:flex-end}.industrial-chatbot-message.user>div{max-width:82%;padding:11px 13px;border-radius:16px 16px 4px 16px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:13px;line-height:1.45}.industrial-chatbot-message.assistant{display:block}.industrial-chatbot-answer{display:inline-block;max-width:92%;padding:12px 14px;border-radius:16px 16px 16px 5px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font-size:13px;line-height:1.55;color:#f8fafc}.industrial-chatbot-cards{display:grid;gap:9px;margin-top:10px}.industrial-chatbot-card{display:flex;justify-content:space-between;gap:10px;padding:11px;border-radius:16px;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.2)}.industrial-chatbot-card-main{display:grid;gap:3px;min-width:0}.industrial-chatbot-card strong{font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.industrial-chatbot-card span,.industrial-chatbot-card small{font-size:11px;color:rgba(226,232,240,.66)}.industrial-chatbot-card em{font-style:normal;font-size:11px;color:#a7f3d0}.industrial-chatbot-map-action{align-self:center;white-space:nowrap;border:none;border-radius:11px;padding:8px 10px;background:rgba(34,211,238,.14);color:#67e8f9;border:1px solid rgba(103,232,249,.24);font-size:11px;font-weight:800;cursor:pointer}.industrial-chatbot-map-action:hover{background:rgba(34,211,238,.23)}.industrial-chatbot-prompts{display:flex;gap:8px;overflow-x:auto;padding:0 16px 12px}.industrial-chatbot-prompts.is-compact{padding-top:2px}.industrial-chatbot-prompt,.industrial-chatbot-followup{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:#e0f2fe;border-radius:999px;padding:8px 10px;font-size:11px;white-space:nowrap;cursor:pointer}.industrial-chatbot-prompt:hover,.industrial-chatbot-followup:hover{background:rgba(255,255,255,.13)}.industrial-chatbot-followups{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.industrial-chatbot-followup.analytics{color:#c4b5fd}.industrial-chatbot-form{display:flex;gap:9px;padding:13px;border-top:1px solid rgba(255,255,255,.1);background:rgba(2,6,23,.35)}.industrial-chatbot-form input{flex:1;min-width:0;border:none;border-radius:15px;background:rgba(255,255,255,.09);color:#fff;padding:12px 13px;outline:1px solid rgba(255,255,255,.08);font-size:13px}.industrial-chatbot-form input:focus{outline-color:rgba(34,211,238,.55)}.industrial-chatbot-form button{border:none;border-radius:15px;padding:0 15px;background:linear-gradient(135deg,#06b6d4,#6366f1);color:#fff;font-weight:800;cursor:pointer}.industrial-chatbot-form button:disabled,.industrial-chatbot-form input:disabled{opacity:.6;cursor:not-allowed}.industrial-chatbot-typing{display:flex;gap:5px;align-items:center;padding:11px 13px;width:max-content;border-radius:16px;background:rgba(255,255,255,.08)}.industrial-chatbot-typing span{width:7px;height:7px;border-radius:999px;background:#67e8f9;animation:industrialTyping 1s infinite ease-in-out}.industrial-chatbot-typing span:nth-child(2){animation-delay:.15s}.industrial-chatbot-typing span:nth-child(3){animation-delay:.3s}@keyframes industrialPulse{0%,100%{transform:scale(.92);opacity:.55}50%{transform:scale(1.12);opacity:.12}}@keyframes industrialTyping{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}@media(max-width:680px){.industrial-chatbot-launcher{right:16px;bottom:16px}.industrial-chatbot-panel{right:12px;left:12px;bottom:84px;width:auto}}
    `;
    document.head.appendChild(style);
  }
}

export default IndustrialChatbot;
