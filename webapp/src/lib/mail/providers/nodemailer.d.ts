declare module 'nodemailer' {
  interface TransportOptions {
    host: string
    port: number
    secure: boolean
    auth: { user: string; pass: string }
  }

  interface SentMessage {
    messageId?: string
  }

  interface Transporter {
    sendMail(mail: { from: string; to: string; subject: string; html: string }): Promise<SentMessage>
    close(): void
  }

  interface NodemailerStatic {
    createTransport(options: TransportOptions): Transporter
  }

  const nodemailer: NodemailerStatic
  export default nodemailer
}
