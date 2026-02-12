
const { MongoClient } = require('mongodb');

// Lấy chuỗi kết nối từ biến môi trường
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  // 1. Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Chấp nhận POST để xử lý mọi hành động (Find, Insert, Sync)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    const { dbName, collectionName, action, data } = req.body;
    
    if (!dbName || !collectionName || !action) {
      return res.status(400).json({ error: 'Thiếu thông tin dbName, collectionName hoặc action' });
    }

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    let result;

    if (action === 'find') {
      // Tìm kiếm toàn bộ (hoặc theo filter trong data)
      result = await collection.find(data || {}).toArray();
    } else if (action === 'insert') {
      // Thêm một bản ghi mới
      result = await collection.insertOne(data);
    } else if (action === 'sync') {
      // Xóa toàn bộ collection và thay thế bằng dữ liệu mới (Dành cho việc lưu State từ React)
      await collection.deleteMany({});
      if (Array.isArray(data) && data.length > 0) {
        result = await collection.insertMany(data);
      } else if (data && !Array.isArray(data)) {
        result = await collection.insertOne(data);
      } else {
        result = { message: "Collection cleared" };
      }
    } else {
      return res.status(400).json({ error: 'Action không hợp lệ (find, insert, sync)' });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
