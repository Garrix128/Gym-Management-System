-- ============================================================
-- GYMPRO 会员管理系统 — 数据库初始化脚本
-- 数据库: gym-pro
-- 使用前请确保已在 MySQL 中创建数据库: CREATE DATABASE `gym-pro` DEFAULT CHARSET utf8mb4;
-- ============================================================

USE `gym-pro`;

DROP TABLE IF EXISTS `members`;

CREATE TABLE `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT '' COMMENT '邮箱',
  `plan` VARCHAR(20) NOT NULL DEFAULT 'Basic' COMMENT '会员计划: Pro / Basic / PT',
  `join_date` DATE NOT NULL COMMENT '注册日期',
  `attendance` TINYINT UNSIGNED DEFAULT 0 COMMENT '出勤率 0-100',
  `bodyscale_date` DATE DEFAULT NULL COMMENT '最近体测日期',
  `bodyscale_fat` DECIMAL(4,1) DEFAULT NULL COMMENT '体脂率 %',
  `bodyscale_muscle` DECIMAL(5,1) DEFAULT NULL COMMENT '肌肉量 kg',
  `bodyscale_weight` DECIMAL(5,1) DEFAULT NULL COMMENT '体重 kg',
  `badges` VARCHAR(200) DEFAULT '' COMMENT '徽章, 逗号分隔',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员表';

-- 插入初始测试数据
INSERT INTO `members` (`name`, `phone`, `email`, `plan`, `join_date`, `attendance`, `bodyscale_date`, `bodyscale_fat`, `bodyscale_muscle`, `bodyscale_weight`, `badges`) VALUES
('张伟', '13800001111', 'zhangwei@example.com', 'Pro', '2026-01-15', 95, '2026-05-08', 18.5, 58.2, 72.5, '本月之星'),
('李娜', '13800002222', 'lina@example.com', 'Pro', '2026-02-20', 88, '2026-04-15', 22.1, 48.5, 56.0, '进步最快'),
('王芳', '13800003333', 'wangfang@example.com', 'Basic', '2026-03-01', 92, NULL, NULL, NULL, NULL, '全勤'),
('刘洋', '13800004444', 'liuyang@example.com', 'PT', '2026-01-08', 90, '2026-05-09', 18.5, 55.0, 70.0, '体测达标'),
('周杰', '13800005555', 'zhoujie@example.com', 'Pro', '2026-04-12', 78, NULL, NULL, NULL, NULL, '');
