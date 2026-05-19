/**
 * GYMPRO 体育训练管理系统 — 后端服务
 * Express + MySQL (mysql2)
 *
 * 启动: npm start
 * 默认端口: 3456
 *
 * 数据库配置 — 请在下方修改为你的实际数据库连接信息
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3456;

// ============================================================
// 数据库连接配置 — 请根据你的 Navicat 连接信息修改
// ============================================================
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',          // ← 修改为你的 MySQL 用户名
  password: '0902',          // ← 修改为你的 MySQL 密码
  database: 'gym-pro'
};

let pool;

async function initDB() {
  pool = mysql.createPool(dbConfig);
  // 测试连接
  const conn = await pool.getConnection();
  console.log('[DB] MySQL 连接成功 — 数据库: gym-pro');
  conn.release();

  // 如果 member 表不存在则自动创建
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) DEFAULT '',
      email VARCHAR(100) DEFAULT '',
      plan VARCHAR(20) NOT NULL DEFAULT 'Basic',
      join_date DATE NOT NULL,
      attendance TINYINT UNSIGNED DEFAULT 0,
      bodyscale_date DATE DEFAULT NULL,
      bodyscale_fat DECIMAL(4,1) DEFAULT NULL,
      bodyscale_muscle DECIMAL(5,1) DEFAULT NULL,
      bodyscale_weight DECIMAL(5,1) DEFAULT NULL,
      badges VARCHAR(200) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('[DB] 会员表已就绪');
}

// ============================================================
// 中间件
// ============================================================
app.use(cors());
app.use(express.json());

// 管理员权限中间件 — 仅允许 admin 角色访问写操作
function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: '权限不足，仅管理员可执行此操作' });
  }
  next();
}

// ============================================================
// API 路由: 会员管理
// ============================================================

// GET /api/members — 查询全部会员 (支持搜索/筛选/排序)
app.get('/api/members', async (req, res) => {
  try {
    const { search, plan, sort } = req.query;
    let sql = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND name LIKE ?';
      params.push('%' + search + '%');
    }
    if (plan) {
      sql += ' AND plan = ?';
      params.push(plan);
    }

    switch (sort) {
      case 'attendance': sql += ' ORDER BY attendance DESC'; break;
      case 'date':       sql += ' ORDER BY join_date DESC'; break;
      default:           sql += ' ORDER BY name ASC';
    }

    const [rows] = await pool.execute(sql, params);

    // 转换字段格式给前端
    const members = rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      plan: r.plan,
      joinDate: r.join_date instanceof Date
        ? r.join_date.toISOString().slice(0, 10)
        : String(r.join_date).slice(0, 10),
      attendance: r.attendance,
      bodyscale: r.bodyscale_date ? [{
        date: r.bodyscale_date instanceof Date
          ? r.bodyscale_date.toISOString().slice(0, 10)
          : String(r.bodyscale_date).slice(0, 10),
        fat: Number(r.bodyscale_fat) || 0,
        muscle: Number(r.bodyscale_muscle) || 0,
        weight: Number(r.bodyscale_weight) || 0
      }] : [],
      badges: r.badges ? r.badges.split(',').filter(Boolean) : []
    }));

    res.json(members);
  } catch (err) {
    console.error('[API] GET /api/members 失败:', err.message);
    res.status(500).json({ error: '查询会员失败' });
  }
});

// GET /api/members/:id — 查询单个会员
app.get('/api/members/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: '会员不存在' });

    const r = rows[0];
    const member = {
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      email: r.email || '',
      plan: r.plan,
      joinDate: String(r.join_date).slice(0, 10),
      attendance: r.attendance,
      bodyscale: r.bodyscale_date ? [{
        date: String(r.bodyscale_date).slice(0, 10),
        fat: Number(r.bodyscale_fat) || 0,
        muscle: Number(r.bodyscale_muscle) || 0,
        weight: Number(r.bodyscale_weight) || 0
      }] : [],
      badges: r.badges ? r.badges.split(',').filter(Boolean) : []
    };

    res.json(member);
  } catch (err) {
    console.error('[API] GET /api/members/:id 失败:', err.message);
    res.status(500).json({ error: '查询会员失败' });
  }
});

// POST /api/members — 新增会员 (管理员)
app.post('/api/members', requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, plan } = req.body;
    if (!name) return res.status(400).json({ error: '姓名不能为空' });

    const [result] = await pool.execute(
      'INSERT INTO members (name, phone, email, plan, join_date, attendance, badges) VALUES (?, ?, ?, ?, CURDATE(), 0, ?)',
      [name, phone || '', email || '', plan || 'Basic', '']
    );

    res.status(201).json({ id: result.insertId, message: '会员添加成功' });
  } catch (err) {
    console.error('[API] POST /api/members 失败:', err.message);
    res.status(500).json({ error: '添加会员失败' });
  }
});

// PUT /api/members/:id — 更新会员 (管理员)
app.put('/api/members/:id', requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, plan } = req.body;
    if (!name) return res.status(400).json({ error: '姓名不能为空' });

    const [result] = await pool.execute(
      'UPDATE members SET name=?, phone=?, email=?, plan=? WHERE id=?',
      [name, phone || '', email || '', plan || 'Basic', req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: '会员不存在' });

    res.json({ message: '会员更新成功' });
  } catch (err) {
    console.error('[API] PUT /api/members/:id 失败:', err.message);
    res.status(500).json({ error: '更新会员失败' });
  }
});

// DELETE /api/members/:id — 删除会员 (管理员)
app.delete('/api/members/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM members WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '会员不存在' });

    res.json({ message: '会员删除成功' });
  } catch (err) {
    console.error('[API] DELETE /api/members/:id 失败:', err.message);
    res.status(500).json({ error: '删除会员失败' });
  }
});

// 静态文件服务 — 提供前端页面
app.use(express.static(path.join(__dirname)));

// 路由重定向 — 支持不带 .html 扩展名的访问
app.get('/prototype', (req, res) => res.redirect('/prototype.html'));
app.get('/login', (req, res) => res.redirect('/pages/login.html'));
app.get('/members', (req, res) => res.redirect('/pages/members.html'));

// ============================================================
// 启动服务
// ============================================================
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('[SERVER] GYMPRO 后端服务已启动');
      console.log('[SERVER] 地址: http://localhost:' + PORT);
      console.log('[SERVER] 前端: http://localhost:' + PORT + '/prototype.html');
      console.log('[SERVER] API:  http://localhost:' + PORT + '/api/members');
    });
  } catch (err) {
    console.error('[SERVER] 启动失败:', err.message);
    console.error('[SERVER] 请检查:');
    console.error('  1. MySQL 服务是否已启动');
    console.error('  2. 数据库 gym-pro 是否已创建');
    console.error('  3. server.js 中的数据库连接配置是否正确 (host/user/password)');
    process.exit(1);
  }
}

start();
