require("dotenv").config({ path: "./../../.env" });
const { createQuestionTemplate } = require('./template/helper/questionsethelper');

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const migrateData = async () => {
    try {
        // Ensure the connection is established before making queries
        await mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = mongoose.connection.db; // Get the native MongoDB database instance

        // Find the documents
        const dateQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f350abaaf0a4decfa9a105c") });
        const multiselectQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f3504b319377eecddb06926") });
        const matrixQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f350abaaf0a4decfa9a105b") });
        const numberQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f3504b319377eecddb06924") });
        const radioQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f34ade94c793c93779bdc52") });
        const sliderQuestion = await db.collection("questions").findOne({ _id: ObjectId("5fa278cb6c10b27561cd281f") });
        const textQuestion = await db.collection("questions").findOne({ _id: ObjectId("5f34ade94c793c93779bdc55") });

        const questions = [dateQuestion, multiselectQuestion, matrixQuestion, numberQuestion, radioQuestion, sliderQuestion, textQuestion];

        // Ensure all the data exists before attempting to create question templates
        if (questions.every(q => q !== null)) {
            const questionTemplates = await Promise.all(questions.map(q => createQuestionTemplate(q, 0)));
            console.log(questionTemplates);
        } else {
            console.log('One or more documents not found');
        }
    } catch (error) {
        console.error('Error finding document:', error);
    } finally {
        // Clean up the connection
        await mongoose.connection.close();
    }
};

migrateData();
