(function () {
  const ctaHTML = `
    <div class="top-bar">
      <a href="https://wa.me/0749594464" target="_blank" class="icon whatsapp" title="WhatsApp"></a>
      <a id="order-btn" href="#" class="cta" title="Order This Website">Order This Website</a>
      <a href="tel:+256791779448" class="icon phone" title="Call"></a>
    </div>
    <style>
      body { margin:0; font-family: Arial, sans-serif; }
      .top-bar {
        position: fixed; top: 20px; display: flex; align-items: center; justify-content: center;
        background: #ffffff; padding: 12px 22px; border-radius: 50px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000; width: 400px; left: 50%; transform: translateX(-50%);
      }
      .top-bar::before {
        content: ''; position: absolute; top: 6px; left: 6px; right: 6px; bottom: 6px;
        border: 2px solid #25d366; border-radius: 46px; z-index: -1;
      }
      .top-bar a { display: flex; align-items: center; justify-content: center; text-decoration: none; margin: 0 10px; }
      .icon { width: 24px; height: 24px; background-size: cover; background-position: center; }
      .whatsapp { background-image: url('https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg'); }
      .phone { background-image: url('https://img.icons8.com/ios-filled/50/007bff/phone.png'); }
      .cta { background: green; color: white; font-weight: bold; padding: 8px 15px; border-radius: 20px; font-size: 16px; }
      @media (max-width: 575px) {
        .top-bar { width: 80%; padding: 8px 15px; top: 10px; }
        .icon { width: 20px; height: 20px; }
        .cta { font-size: 14px; padding: 6px 12px; }
      }
    </style>
  `;

  document.body.insertAdjacentHTML("beforeend", ctaHTML);

  const templateName = document.body.getAttribute("data-template") || document.title.trim();
  const orderBtn = document.getElementById("order-btn");
  if (orderBtn) {
    orderBtn.href = "/order?template=" + encodeURIComponent(templateName);
  }
})();
