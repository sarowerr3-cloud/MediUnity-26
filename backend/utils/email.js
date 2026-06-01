import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.log(`\n==============================================`);
      console.log(`[SIMULATED EMAIL] (EMAIL_USER/EMAIL_PASS not set)`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`----------------------------------------------`);
      console.log(html.replace(/<[^>]*>/g, ' ').trim()); // Plain text version
      console.log(`==============================================\n`);
      return { success: true, simulated: true };
    }

    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.EMAIL_PORT || "587");
    const secure = process.env.EMAIL_SECURE === "true";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"Mediunity Clinic" <${user}>`,
      to,
      subject,
      html
    });

    console.log(`Email successfully sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}
