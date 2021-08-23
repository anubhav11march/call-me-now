const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('./../db');
const { v4: uuid } = require('uuid');

const adminMiddleware = (req, res, next) => {
    if (req.query.token !== '58fafa63-054a-469e-a26d-4551c5ce34e5') return res.end('404');
    next();
};

const upload_video = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/videos/');
        },
        filename: function (req, file, cb) {
            cb(null, `${uuid()}.${file.originalname.split('.').reverse()[0]}`);
        },
    }),
});

const upload_isp_logo = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images/isp_logos/');
        },
        filename: function (req, file, cb) {
            cb(null, `${uuid()}.${file.originalname.split('.').reverse()[0]}`);
        },
    }),
});

router.get('/', adminMiddleware, async (req, res) => {
    const records = db.get('records').value();
    res.render('admin', { records });
});

router.get('/records/:id/delete', async (req, res) => {
    db.get('records').remove({ id: req.params.id }).write();
    res.redirect('back');
});

router.post('/records', upload_isp_logo.single('isp_logo'), async (req, res) => {
    console.log(1, req.body, req.file);

    db.get('records')
        .insert({
            id: uuid(),
            ...req.body,
            isp_logo_name: req.file.filename,
            created_at: new Date(),
        })
        .write();

    res.redirect('back');
});

router.get('/country-video', adminMiddleware, async (req, res) => {
    const records = db.get('country_video').value();
    res.render('admin-country-video', { records });
});

router.get('/admin-country-video/:id/delete', async (req, res) => {
    db.get('country_video').remove({ id: req.params.id }).write();
    res.redirect('back');
});

router.post('/country-video', upload_video.single('video_file'), async (req, res) => {
    console.log(1, req.body, req.file);

    db.get('country_video')
        .insert({
            id: uuid(),
            ...req.body,
            video_file_name: req.file.filename,
            created_at: new Date(),
        })
        .write();

    res.redirect('back');
});

module.exports = router;
