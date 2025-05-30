const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 10000;
const API_KEY = 'sk_test_8530618907b2458e93f7e1eee9d18da8'; // sua chave secreta real da Pagar.me

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.post('/card_hash', async (req, res) => {
  try {
    const card = req.body;

    const response = await axios.post(
      'https://api.pagar.me/core/v5/cards',
      {
        number: card.number,
        holder_name: card.holder_name,
        expiration_date: card.expiration_date,
        cvv: card.cvv
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ card_id criado:', response.data.id);
    res.json({ card_id: response.data.id });

  } catch (err) {
    console.error('❌ Erro ao gerar card_id:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao gerar card_id' });
  }
});

app.post('/doar', async (req, res) => {
  try {
    const { nome, email, cpf, valor, formaPagamento, card_id } = req.body;

    const amountInCents = Math.round(parseFloat(valor) * 100);

    const response = await axios.post(
      'https://api.pagar.me/core/v5/orders',
      {
        items: [{ name: 'Doação', quantity: 1, unit_amount: amountInCents }],
        customer: {
          name: nome,
          email: email,
          type: 'individual',
          documents: [{ type: 'cpf', number: cpf }],
        },
        payments: [
          {
            payment_method: formaPagamento,
            credit_card: { card_id: card_id }
          }
        ]
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Doação realizada:', response.data.id);
    res.json({ success: true, order_id: response.data.id });

  } catch (err) {
    console.error('❌ Erro ao doar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao processar doação' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
