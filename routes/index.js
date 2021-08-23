var express = require('express');
var router = express.Router();
const IpInfo = require('./../app1');
const db = require('./../db');
const _ = require('lodash');
const random = require('random');

router.get('/', async (req, res) => {
    // block when desktop
    if (req.useragent.isDesktop) {
        return res.send('<h2>Service is not available on Desktop</h2>');
    }

    //
    const country_isp = {};

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
    const { country_name, isp_name } = req.query;

    // use query param if present
    if (country_name && isp_name) {
        const x = db.get('records').filter({ country_name, isp_name }).take(1).value()[0];
        record = process_record(x);
    }
    // else use ip
    else {
        try {
            console.log({ip: req.clientIp});

            const ipinfo = await IpInfo(req.clientIp);
            console.log({isp: ipinfo.isp});
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
            }
        } catch (error) {
            console.log(error);
        }
    }

    console.log({ record });

    res.render('index', { record, country_isp });
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
