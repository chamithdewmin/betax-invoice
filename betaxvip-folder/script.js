// Initial invoice data
let invoiceData = {
  invoiceNumber: '#000001',
  invoiceDate: new Date().toISOString().split('T')[0],
  clientName: '',
  clientPhone: '',
  clientCapital: '',
  taxRate: 0,
  currencySymbol: '$',
  lineItems: [{ service: 'Betax paid vip lifetime Access', quantity: 1, unitPrice: 59 }],
  notes:
    'This invoice confirms payment to BetaxVIP for the listed service. All payments are final and non-refundable once access or service begins. BetaxVIP provides educational services only and is not responsible for trading outcomes. By paying, the client agrees to these terms.',
};

document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
  renderLineItems();
  updatePreview();
  setupEventListeners();
});

function initializeForm() {
  for (let key in invoiceData) {
    if (document.getElementById(key)) document.getElementById(key).value = invoiceData[key];
  }
  const currencyInput = document.getElementById('currencyInput');
  if (currencyInput) currencyInput.value = invoiceData.currencySymbol;
}

function setupEventListeners() {
  document.querySelectorAll('#invoiceForm input, #invoiceForm textarea').forEach(input => {
    input.addEventListener('input', e => {
      const id = e.target.id;

      if (id === 'currencyInput') {
        invoiceData.currencySymbol = e.target.value.trim() || '$';
        renderLineItems();
        updatePreview();
      } else if (id === 'taxRate' || id === 'clientCapital') {
        invoiceData[id] = parseFloat(e.target.value) || 0;
        updatePreview();
      } else {
        invoiceData[id] = e.target.value;
        updatePreview();
      }
    });
  });

  document.getElementById('addLineItem').addEventListener('click', addLineItem);
  document.getElementById('downloadPdf').addEventListener('click', downloadPDF);
}

function renderLineItems() {
  const container = document.getElementById('lineItemsContainer');
  container.innerHTML = '';

  invoiceData.lineItems.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'line-item';
    div.innerHTML = `
      <div class="form-group"><label>Service</label><input type="text" class="service" data-index="${i}" value="${item.service}"></div>
      <div class="form-group"><label>Qty</label><input type="number" class="qty" data-index="${i}" value="${item.quantity}" min="1"></div>
      <div class="form-group"><label>Unit Price (${invoiceData.currencySymbol})</label><input type="number" class="price" data-index="${i}" value="${item.unitPrice}" min="0"></div>
      <button type="button" class="btn btn-danger remove" data-index="${i}">Remove</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.service, .qty, .price').forEach(input => {
    input.addEventListener('input', e => {
      const index = e.target.dataset.index;
      const cls = e.target.classList[0];
      if (cls === 'service') invoiceData.lineItems[index].service = e.target.value;
      if (cls === 'qty') invoiceData.lineItems[index].quantity = parseInt(e.target.value) || 1;
      if (cls === 'price') invoiceData.lineItems[index].unitPrice = parseFloat(e.target.value) || 0;
      updatePreview();
    });
  });

  container.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = e.target.dataset.index;
      invoiceData.lineItems.splice(i, 1);
      renderLineItems();
      updatePreview();
    });
  });
}

function addLineItem() {
  invoiceData.lineItems.push({ service: '', quantity: 1, unitPrice: 0 });
  renderLineItems();
  updatePreview();
}

function calculateTotals() {
  const subtotal = invoiceData.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function formatCurrency(num) {
  const symbol = invoiceData.currencySymbol || '$';
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function updatePreview() {
  const { subtotal, tax, total } = calculateTotals();
  const preview = document.getElementById('invoicePreview');

  preview.innerHTML = `
    <div class="invoice-container">
      <div class="invoice-content">
        <div class="invoice-header">
          <div class="company-info">
            <img src="assets/logo.png" alt="BetaxVIP Logo" crossorigin="anonymous">
          </div>
          <div class="invoice-meta">
            <div class="invoice-title"><strong>INVOICE</strong></div>
            <p>${invoiceData.invoiceNumber}</p>
          </div>
        </div>

        <div class="invoice-details">
          <p><strong>Client:</strong> ${invoiceData.clientName || ''}</p>
          <p><strong>Phone:</strong> ${invoiceData.clientPhone || ''}</p>
          <p><strong>Capital:</strong> ${invoiceData.clientCapital || invoiceData.currencySymbol + ' 0.00'}</p>
          <p><strong>Date:</strong> ${invoiceData.invoiceDate}</p>
          <br>
        </div>

        <table class="invoice-table">
          <thead>
            <tr><th>#</th><th>Service</th><th>Price (${invoiceData.currencySymbol})</th><th>Qty</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${invoiceData.lineItems
              .map(
                (item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.service}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>

        <div class="invoice-totals">
          <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="total-row"><span>Tax:</span><span>${formatCurrency(tax)}</span></div>
          <div class="total-row total"><span>Total:</span><span>${formatCurrency(total)}</span></div>
        </div>

        <div class="invoice-footer">
          <p><strong>Terms:</strong><br>${invoiceData.notes}</p>
          <div class="payment-footer">
            <p>Thank you for your payment! | BETAXVIP</p>
            <p>Email: betaxvip@gmail.com | Phone: +971 55 352 6522</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function downloadPDF() {
  const btn = document.getElementById('downloadPdf');
  btn.textContent = 'Generating...';
  btn.disabled = true;

  const element = document.querySelector('.invoice-container');
  const opt = {
    margin: 0,
    filename: `invoice-${invoiceData.invoiceNumber.replace('#', '')}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await html2pdf().set(opt).from(element).save();

  btn.textContent = 'Download PDF';
  btn.disabled = false;
}
