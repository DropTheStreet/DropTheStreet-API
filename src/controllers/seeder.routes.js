const express = require('express');
const router = express.Router();

router.post('/seeder', async (req, res) => {
    try {
        //Roles
        const roleSeederResponse = await fetch('http://localhost:3000/role/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!roleSeederResponse.ok) {
            console.error('Error during execution of role seeder');
        }

        console.log('Role seeder was created successfully');

        //Users
        const userSeederResponse = await fetch('http://localhost:3000/user/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!userSeederResponse.ok) {
            console.error('Error during execution of user seeder');
        }

        console.log('User seeder was created successfully');

        //Support
        const supportSeederResponse = await fetch('http://localhost:3000/support/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!supportSeederResponse.ok) {
            console.error('Error during execution of support seeder');
        }

        console.log('Support seeder was created successfully');

        //Statistic
        const statisticSeederResponse = await fetch('http://localhost:3000/statistic/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!statisticSeederResponse.ok) {
            console.error('Error during execution of statistic seeder');
        }

        console.log('Statistic seeder was created successfully');

        //Category

        const categorySeederResponse = await fetch('http://localhost:3000/category/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!categorySeederResponse.ok) {
            console.error('Error during execution of category seeder');
        }

        console.log('Category seeder was created successfully');

        //Image

        const imageSeederResponse = await fetch('http://localhost:3000/image/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!imageSeederResponse.ok) {
            console.error('Error during execution of image seeder');
        }

        console.log('Image seeder was created successfully');

        //Product

        const productSeederResponse = await fetch('http://localhost:3000/product/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!productSeederResponse.ok) {
            console.error('Error during execution of product seeder');
        }

        console.log('Product seeder was created successfully');

        //Product Favorite

        const productFavoriteSeederResponse = await fetch('http://localhost:3000/favorite/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!productFavoriteSeederResponse.ok) {
            console.error('Error during execution of favorites seeder');
        }

        console.log('Favorites seeder was created successfully');

        //Product image

        const productImageSeederResponse = await fetch('http://localhost:3000/product-image/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!productImageSeederResponse.ok) {
            console.error('Error during execution of product images seeder');
        }

        console.log('Product images seeder was created successfully');

        //Notification type

        const notificationTypeSeederResponse = await fetch('http://localhost:3000/notification-type/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!notificationTypeSeederResponse.ok) {
            console.error('Error during execution of notification type seeder');
        }

        console.log('Notification type seeder was created successfully');

        //Notification

        const notificationSeederResponse = await fetch('http://localhost:3000/notification/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!notificationSeederResponse.ok) {
            console.error('Error during execution of notification seeder');
        }

        console.log('Notification seeder was created successfully');

        //Badge

        const badgeSeederResponse = await fetch('http://localhost:3000/badge/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!badgeSeederResponse.ok) {
            console.error('Error during execution of badge seeder');
        }

        console.log('Badge seeder was created successfully');

        //Challenge

        const challengeSeederResponse = await fetch('http://localhost:3000/challenge/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!challengeSeederResponse.ok) {
            console.error('Error during execution of challenge seeder');
        }

        console.log('Challenge seeder was created successfully');

        //User badge

        const userBadgeSeederResponse = await fetch('http://localhost:3000/user-badge/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!userBadgeSeederResponse.ok) {
            console.error('Error during execution of user badge seeder');
        }

        console.log('User badge seeder was created successfully');

        //User challenge

        const userChallengeSeederResponse = await fetch('http://localhost:3000/user-challenge/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!userChallengeSeederResponse.ok) {
            console.error('Error during execution of user challenge seeder');
        }

        console.log('User challenge seeder was created successfully');

        //Drop

        const dropSeederResponse = await fetch('http://localhost:3000/drop/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!dropSeederResponse.ok) {
            console.error('Error during execution of drop seeder');
        }

        console.log('Drop seeder was created successfully');

        //Shopping cart

        const cartSeederResponse = await fetch('http://localhost:3000/cart/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!cartSeederResponse.ok) {
            console.error('Error during execution of cart seeder');
        }

        console.log('Cart seeder was created successfully');

        //Payment status

        const paymentStatusSeederResponse = await fetch('http://localhost:3000/payment-status/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!paymentStatusSeederResponse.ok) {
            console.error('Error during execution of payment status seeder');
        }

        console.log('Payment status seeder was created successfully');

        //Payment

        const paymentSeederResponse = await fetch('http://localhost:3000/payment/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!paymentSeederResponse.ok) {
            console.error('Error during execution of payment seeder');
        }

        console.log('Payment seeder was created successfully');

        //Auction

        const auctionSeederResponse = await fetch('http://localhost:3000/auction/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!auctionSeederResponse.ok) {
            console.error('Error during execution of auction seeder');
        }

        console.log('Auction seeder was created successfully');


        //History auction

        const historyAuctionSeederResponse = await fetch('http://localhost:3000/history-auction/seeder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!historyAuctionSeederResponse.ok) {
            console.error('Error during execution of history auction seeder');
        }

        console.log('History auction seeder was created successfully');

        res.status(200).send({ message: 'All seeders was executed successfully' });

    } catch (error) {
        console.error('Error during execution of seeders:', error);
    }
});

module.exports = {
    initializeRoutes: () => router
};
