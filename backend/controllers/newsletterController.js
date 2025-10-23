import Subscriber from '../models/subscriberModel.js';
import nodemailer from 'nodemailer';



export const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    // 1️⃣ Strict email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }

    const [localPart, domain] = email.split('@');
    const lowerDomain = domain.toLowerCase();

    // 2️⃣ Block suspicious/disposable domains
    const blockedDomains = [
      'tempmail.com', 'mailinator.com', '10minutemail.com',
      'yopmail.com', 'guerrillamail.com', 'dispostable.com'
    ];
    if (blockedDomains.includes(lowerDomain)) {
      return res.status(400).json({ message: 'Email suspect ou jetable non autorisé' });
    }

    // 3️⃣ Check if local part looks random (too many numbers or gibberish)
    const randomPattern = /^[a-zA-Z]{1,}[0-9]{5,}$/; // e.g., abc12345
    if (randomPattern.test(localPart)) {
      return res.status(400).json({ message: 'Email semble suspect' });
    }

    // 4️⃣ Optionally: check length to prevent spammy long addresses
    if (email.length > 100) {
      return res.status(400).json({ message: 'Email trop long' });
    }

    // 5️⃣ Check duplicates
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Déjà abonné' });

    // 6️⃣ Save new subscriber
    const newSub = new Subscriber({ email });
    await newSub.save();
    res.status(200).json({ message: 'Inscription réussie!' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', err });
  }
};


export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ date: -1 });
    res.status(200).json({ count: subscribers.length, subscribers });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', err });
  }
};

export const sendNewsletter = async (req, res) => {
  try {
    const { subject, message, imageUrl } = req.body;
    const subscribers = await Subscriber.find();
    
    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'Aucun abonné trouvé' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD
      }
    });

    for (const sub of subscribers) {
      await transporter.sendMail({
        from: `Kebab Express <${process.env.EMAIL_USER}>`,
        to: sub.email,
        subject,
        html: `
          <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;'>
            <h2 style='color: #FF6B35;'>${subject}</h2>
            <p style='font-size: 16px; color: #333; line-height: 1.6;'>${message}</p>
            ${imageUrl ? `<img src='${imageUrl}' style='max-width: 100%; border-radius: 10px; margin: 20px 0;' alt='Newsletter image'>` : ''}
            <hr style='margin: 20px 0; border: none; border-top: 1px solid #ddd;'>
            <p style='font-size: 14px; color: #666;'>Merci d'être abonné à Kebab Express !</p>
            <p style='font-size: 12px; color: #999;'>25 Rue du Goût, Paris | +33 1 23 45 67 89</p>
          </div>
        `
      });
    }

    res.status(200).json({ 
      message: `Newsletter envoyée à ${subscribers.length} abonné(s)!` 
    });
  } catch (err) {
  console.error("❌ Newsletter send error:", err);
  res.status(500).json({ message: "Erreur lors de l'envoi", error: err.message });
}

};

export const deleteSubscriber = async (req, res) => {
  try {
    const { email } = req.body; // 🟢 we take the email from the request body

    // 1️⃣ Check if email was provided
    if (!email) {
      return res.status(400).json({ message: "Email requis pour supprimer l'abonné" });
    }

    // 2️⃣ Try to find the subscriber by email
    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ message: "Abonné introuvable" });
    }

    // 3️⃣ Delete the subscriber
    await subscriber.deleteOne();

    // 4️⃣ Send success message
    res.status(200).json({ message: "Abonné supprimé avec succès" });

  } catch (err) {
    // 5️⃣ Handle errors
    res.status(500).json({ message: "Erreur serveur", err });
  }
};

