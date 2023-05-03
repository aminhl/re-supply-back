const Donation = require('../models/donationModel');
const Web3 = require("web3");
const Request = require('../models/requestModel');

// Create new donation
const createDonation = async (req, res) => {
    try {
        const { donor_id, recipient_id, type, value, notes } = req.body;
        const donation = new Donation({ donor_id, recipient_id, type, value, notes });
        await donation.save();
        res.status(201).json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all donations
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find();
        res.json(donations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get donation by ID
const getDonationById = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        res.json(donation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update donation
const updateDonation = async (req, res) => {
    try {
        const { donor_id, recipient_id, type, value, notes } = req.body;
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        donation.donor_id = donor_id;
        donation.recipient_id = recipient_id;
        donation.type = type;
        donation.value = value;
        donation.notes = notes;
        await donation.save();
        res.json(donation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete donation
const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        await donation.remove();
        res.json({ message: 'Donation deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const axios = require('axios');

async function convertETHtoUSD(ethAmount) {
    try {
        // Get the current ETH price in USD
        const response = await axios
          .get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethPrice = response.data.ethereum.usd;

        // Convert the ETH amount to USD
        const usdAmount = ethAmount * ethPrice;

        return usdAmount.toFixed(2); // Specify 2 decimal places for USD amount
    } catch (error) {
        console.error(error);
    }
}

const sendETHFunc = (fromAddress, toAddress, privateKey, amount) => {
    // Connect to an Ethereum node
    const web3 = new Web3(
      "wss://lingering-thrumming-wish.ethereum-sepolia.discover.quiknode.pro/d6f0e289b76431ff7a34db8a9d80cd120c2839ad/"
    );

    // Create transaction object
    let transaction = {
        from: fromAddress,
        to: toAddress,
        gas: web3.utils.toHex(21000),
        value: web3.utils.toHex(web3.utils.toWei(amount, "ether")),
    };

    // Sign the transaction
    const signTx = new Promise((resolve, reject) => {
        resolve(web3.eth.accounts.signTransaction(transaction, privateKey));
    });

    return new Promise((resolve, reject) => {
        signTx.then((signedTx) => {
            // Send the transaction
            web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
                if (!error) {
                    resolve(hash);
                } else {
                    reject(error);
                }
            });
        });
    });
};

const sendETH = async (req, res) => {
    const requestId = req.params.requestId;
    const request = await Request.findById(requestId);
    const { fromAddress, toAddress, privateKey, amount } = req.body;
    try {
        const hash = await sendETHFunc(fromAddress, toAddress, privateKey, amount);
        const usdAmount = await convertETHtoUSD(amount);
        request.currentValue += +usdAmount;
        await request.save();
        res.status(200).json({ message: "Transaction sent", hash });
    } catch (error) {
        res.status(500).json({ message: "Failed to send transaction", error });
    }
};


module.exports = { createDonation, getAllDonations, getDonationById, updateDonation, deleteDonation, sendETH };
