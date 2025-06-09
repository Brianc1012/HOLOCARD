const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.send('User List');
});

// ================ USER MANAGEMENT ROUTES ================ //

    // Route for getting details of user
    router.get('/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`User Details for ID: ${userId}`);
    })
    // Route for creating a new user
    .post((req, res) => {
        const newUser = req.body; // Assuming you send the new user data in the request body
        res.status(201).send(`New user created with ID: ${newUser.id}`);
    })
    // Route for updating a new user
    .put((req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body; // Assuming you send the updated user data in the request body
    res.send(`User with ID: ${userId} has been updated`);
    })
    // Route for deleting a user
    .delete((req, res) => {
    const userId = req.params.id;
    res.send(`User with ID: ${userId} has been deleted`);
    });

// ================ EOF USER MANAGEMENT ROUTES ================ //

module.exports = router;
