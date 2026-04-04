const generateDummyTransactions = () => {
  const transactions = [];
  const customers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown', 'Emily Davis', 'James Wilson', 'Lisa Anderson'];
  const products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'USB Cable', 'Headphones', 'Webcam', 'Desk Chair'];
  const methods = ['cash', 'paystack', 'card'];
  const statuses = ['completed', 'pending', 'refunded'];

  for (let i = 1; i <= 50; i++) {
    const unitPrice = Math.floor(Math.random() * 300) + 50;
    const quantity = Math.floor(Math.random() * 5) + 1;
    const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
    const tax = Math.round(lineTotal * 0.1 * 100) / 100;
    const discount = Math.floor(Math.random() * 50);
    const total = lineTotal + tax - discount;
    const method = methods[Math.floor(Math.random() * 3)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    transactions.push({
      transactionId: `TXN${String(i).padStart(3, '0')}`,
      receiptNumber: `RCP-${String(i).padStart(5, '0')}`,
      date: date.toISOString(),
      customer: {
        name: i % 5 === 0 ? 'Walk-in Customer' : customers[Math.floor(Math.random() * customers.length)],
        email: `customer${i}@example.com`,
        phone: `+1234567${String(i).padStart(3, '0')}`,
      },
      items: [{
        product: products[Math.floor(Math.random() * products.length)],
        quantity,
        unitPrice,
        lineTotal,
      }],
      subtotal: lineTotal,
      tax,
      discount,
      total: Math.round(total * 100) / 100,
      payment: {
        method,
        reference: method === 'paystack' ? `PSK-2026040300${String(i).padStart(3, '0')}` : null,
        accessCode: method === 'paystack' ? `psk_live_${i}abc123` : null,
        amount: Math.round(total * 100) / 100,
        status: statuses[Math.floor(Math.random() * 3)],
        timestamp: date.toISOString(),
      },
      status: statuses[Math.floor(Math.random() * 3)],
    });
  }

  return transactions;
};

module.exports = { generateDummyTransactions };
