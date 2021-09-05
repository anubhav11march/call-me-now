var express = require('express');
var router = express.Router();
const IpInfo = require('./../app1');
const db = require('./../db');
const _ = require('lodash');
const random = require('random');
const { v4: uuid } = require('uuid');

router.get('/', async (req, res) => {
    // block when desktop
    if (req.useragent.isDesktop) {
        return res.send('<h2>Service is not available on Desktop</h2>');
    }

    const country_isp = {};

    var visitorID = uuid();

    db.get('records')
        .value()
        .forEach(({ country_name, isp_name, isp_logo_name }) => {
            if (!country_isp[country_name]) {
                country_isp[country_name] = [];
            }

            country_isp[country_name].push({ isp_name, isp_logo_name });
        });

    console.log({ country_isp });

    let record = null;
    const { country_name, isp_name, userID } = req.query;

    console.log('Request Query', req.query);

    // use query param if present
    if (country_name && isp_name) {
        try {
            console.log('When user come with visitor id');
            console.log(userID);
            const oldData = await db.get('analytics').filter({ id: userID }).value()[0];

            oldData.select = 'Yes';
            oldData.select_country = country_name;
            oldData.select_isp = isp_name;

            const x = db.get('records').filter({ country_name, isp_name }).take(1).value()[0];
            record = process_record(x);

            oldData.number_display = record.phone_max;

            await db.get('analytics').remove({ id: userID }).write();
            await db
                .get('analytics')
                .insert({
                    ...oldData,
                })
                .write();

            visitorID = userID;
        } catch {
            console.log('error');
        }
    }
    // else use ip
    else {
        try {
            console.log({ ip: req.clientIp });
            const ipinfo = await IpInfo(req.clientIp);
            console.log({ isp: ipinfo.isp });
            console.log(ipinfo.countryCode);
            const x = db
                .get('records')
                .filter({ country_code: ipinfo.countryCode })
                .value()
                .find(({ isp_name }) => {
                    return (
                        (ipinfo.isp_name &&
                            ipinfo.isp_name.toLowerCase().includes(isp_name.toLowerCase())) ||
                        (ipinfo.org && ipinfo.org.toLowerCase().includes(isp_name.toLowerCase())) ||
                        (ipinfo.as && ipinfo.as.toLowerCase().includes(isp_name.toLowerCase()))
                    );
                });

            if (x) {
                record = process_record(x);
                db.get('analytics')
                    .insert({
                        id: visitorID,
                        ip: req.clientIp,
                        user_country: ipinfo.countryCode,
                        user_isp_name: ipinfo.isp,
                        found: true,
                        phone_number: record.phone_max,
                        select: 'No',
                        select_country: '',
                        select_isp: '',
                        number_display: '',
                        button_clicked: 'No',
                        created_at: new Date(),
                    })
                    .write();
            } else {
                console.log('No record found user is going to sEARCH PAGE');
                db.get('analytics')
                    .insert({
                        id: visitorID,
                        ip: req.clientIp,
                        user_country: ipinfo.countryCode,
                        user_isp_name: ipinfo.isp,
                        found: false,
                        phone_number: '',
                        select: 'No',
                        select_country: '',
                        select_isp: '',
                        number_display: '',
                        button_clicked: 'No',
                        created_at:
                            new Date().toDateString() +
                            ' ' +
                            new Date().getHours() +
                            ':' +
                            new Date().getMinutes(),
                    })
                    .write();
            }
        } catch (error) {
            console.log(error);
        }
    }
    console.log({ record });
    res.render('index', { record, country_isp, visitorID });
});

router.get('/call/:id', async (req, res) => {
    const id = req.params.id;

    console.log(req.params);

    const oldData = await db.get('analytics').filter({ id: id }).value()[0];

    if (oldData) {
        oldData.button_clicked = 'Yes';

        await db.get('analytics').remove({ id: id }).write();
        await db
            .get('analytics')
            .insert({
                ...oldData,
            })
            .write();
    }

    res.json({ message: 'Updated' });
});

const process_record = (x) => {
    const y = db.get('country_video').filter({ country_code: x.country_code }).value()[0];

    const matcher = x.phone_min.match(/^(0+)(\d+)$/);

    const gen_phone = random.int(+x.phone_min, +x.phone_max);

    return {
        ...x,
        ...y,
        phone_number: matcher ? matcher[1] + gen_phone : gen_phone,
    };
};

module.exports = router;
