// api/index.js
const { MongoClient } = require('mongodb');

// Lấy chuỗi kết nối từ biến môi trường (sẽ cài đặt trên Vercel sau)
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  // 1. Cấu hình CORS để Google Apps Script có thể gọi được
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Xử lý request OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Chỉ nhận method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 3. Kết nối MongoDB (nếu chưa kết nối)
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    // Lấy thông tin từ request
    // body gửi lên cần có: { "db": "ten_db", "collection": "ten_bang", "action": "find" hoặc "insert", "data": {...} }
    const { dbName, collectionName, action, data } = req.body;
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    let result;

    // 4. Xử lý logic
    if (action === 'find') {
      // Tìm kiếm (data là điều kiện lọc)
      result = await collection.find(data || {}).toArray();
    } else if (action === 'insert') {
      // Thêm mới
      result = await collection.insertOne(data);
    } else {
      return res.status(400).json({ error: 'Action không hợp lệ' });
    }

    // 5. Trả về kết quả
    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}