const nodemailer = require('nodemailer');

// Créer un transporteur Nodemailer utilisant Mailhog
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false 
});

const amqp = require('amqplib');

const RABBITMQ_URL = "amqp://guest:guest@localhost:5672";
const QUEUE = 'user_signup';

async function startConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: false });

    console.log(`Waiting for messages in ${QUEUE}. To exit press CTRL+C`);

    channel.consume(QUEUE, async (msg) => {
        if (msg !== null) {
            const user = JSON.parse(msg.content.toString());
            console.log("Received a user signup:", user);

            // Envoyer un e-mail de confirmation
            await sendConfirmationEmail(user);
            channel.ack(msg);
        }
    });
}

async function sendConfirmationEmail(user) {
    const mailOptions = {
        from: '"Mail App" <mailapp@example.com>',
        to: user.email, 
        subject: 'Confirmation d\'inscription',
        text: `Bonjour ${user.username},\n\nVotre inscription est confirmée.`,
        html: `<b>Bonjour ${user.username},</b><br><br>Votre inscription est confirmée.`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email de confirmation envoyé: %s', info.messageId);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
}

startConsumer();
