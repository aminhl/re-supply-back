const express = require('express');
const coinbase = require('coinbase-commerce-node');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();

// App setup
const app = express();
let server = app.listen(3000, () => {
    console.log('Listening on port ' + 3000);
});
app.use(bodyParser.json());


const Client = coinbase.Client;
Client.init("f5b2a9c1-7cfe-4f14-895b-cbcc84484a83");
const Charge = coinbase.resources.Charge;

app.post('/charge', (req, res) => {
    let chargeData = {
        name: req.body.name,
        description: req.body.description,
        local_price: {
            amount: req.body.amount,
            currency: 'USD'
        },
        pricing_type: 'fixed_price'
    }

    Charge.create(chargeData, (err, response) => {
        if (err) {
            res.status(400).send({message: err.message});
        } else {
            res.status(200).send(response);
        }
    });
});

app.post('/status', (req, res) => {
    let id = req.body.id;
    Charge.retrieve(id, (err, charge) => {
        console.log(charge);
        if(charge['timeline'][0]['status'] == 'NEW') {
            try {
                if (charge['timeline'][1]['status'] == 'PEDNING' && charge['timeline'].length == 2) {
                    return res.status(200).send({message: 'Payment pending, awaiting confirmations.'});
                } else if (charge['timeline'][1]['status'] == 'EXPIRED') {
                    return res.status(400).send({message: 'Payment expired'});
                } else if(charge['timeline'][2]['status'] == 'COMPLETED') {
                    return res.status(200).send({message: 'Payment completed.'});
                }
            } catch(err) {
                return res.status(200).send({message: 'No payment detected'});
            }
        } else {
            return res.status(400).send({message: 'Charge not found.'});
        }
    });
});