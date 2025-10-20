let invoiceData = {
    invoiceNumber: '#000001',
    invoiceDate: new Date().toISOString().split('T')[0],
    clientName: 'Chamika Welivita',
    clientPhone: '+947XXXXXXXX',
    taxRate: 0,
    lineItems: [{ service: 'Sample Service', quantity: 1, unitPrice: 10000 }],
    notes: 'This invoice confirms payment for the listed service.',
    bankDetails: 'Account number: 0000000000\nName: Example Name\nBANK: Example Bank\nBranch: City'
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
}

function setupEventListeners() {
    document.querySelectorAll('#invoiceForm input, #invoiceForm textarea').forEach(input => {
        input.addEventListener('input', e => {
            invoiceData[e.target.id] = e.target.value;
            updatePreview();
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
            <div class="form-group"><label>Unit Price</label><input type="number" class="price" data-index="${i}" value="${item.unitPrice}" min="0"></div>
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
    return 'LKR ' + num.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function updatePreview() {
    const { subtotal, tax, total } = calculateTotals();
    const preview = document.getElementById('invoicePreview');

    preview.innerHTML = `
        <div class="invoice-container">
            <div class="invoice-content">
                <div class="invoice-header">
                    <div class="company-info">
                        <h2>BETAX VIP</h2>
                        <p>TRADE WITH REALITY</p>
                    </div>
                    <div class="invoice-meta">
                        <div class="invoice-title">INVOICE</div>
                        <p>${invoiceData.invoiceNumber}</p>
                    </div>
                </div>

                <div class="invoice-details">
                    <p><strong>Client:</strong> ${invoiceData.clientName}</p>
                    <p><strong>Phone:</strong> ${invoiceData.clientPhone}</p>
                    <p><strong>Date:</strong> ${invoiceData.invoiceDate}</p>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr><th>#</th><th>Service</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${invoiceData.lineItems.map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${item.service}</td>
                                <td>${formatCurrency(item.unitPrice)}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.quantity * item.unitPrice)}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>

                <div class="invoice-totals">
                    <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
                    <div class="total-row"><span>Tax:</span><span>${formatCurrency(tax)}</span></div>
                    <div class="total-row total"><span>Total:</span><span>${formatCurrency(total)}</span></div>
                </div>

                <div class="invoice-footer">
                    <p><strong>Bank Details:</strong><br>${invoiceData.bankDetails.replace(/\n/g, '<br>')}</p>
                    <p><strong>Terms:</strong><br>${invoiceData.notes}</p>
                    <div class="footer-contact">
                        <span>betaxvip@gmail.com</span>
                        <span>+971 55 352 6522</span>
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
        filename: `invoice-${invoiceData.invoiceNumber.replace('#','')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();

    btn.textContent = 'Download PDF';
    btn.disabled = false;
}
