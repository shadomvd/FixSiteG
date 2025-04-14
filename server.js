const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка multer для загрузки файлов
const upload = multer({ dest: 'storages/temp' });

// Создание директории storages, если не существует
(async () => {
    try {
        await fs.mkdir('storages', { recursive: true });
        await fs.mkdir('storages/temp', { recursive: true });
    } catch (err) {
        console.error('Ошибка создания директорий:', err);
    }
})();

// Middleware для обработки CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Обработка загрузки аватара
app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { uid } = req.body;
        const file = req.file;

        if (!uid || !file) {
            return res.status(400).json({ success: false, message: 'UID и файл обязательны' });
        }

        const fileExtension = path.extname(file.originalname);
        const newFileName = `${uid}_${Date.now()}${fileExtension}`;
        const newPath = path.join('storages', newFileName);

        // Перемещение файла из временной папки в storages
        await fs.rename(file.path, newPath);

        // URL для доступа к файлу (зависит от конфигурации сервера)
        const fileUrl = `${req.protocol}://${req.get('host')}/storages/${newFileName}`;

        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Статическая раздача файлов из папки storages
app.use('/storages', express.static('storages'));

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
