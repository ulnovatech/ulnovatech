export const siteConfig = {
  name: 'UlnovaTech',
  email: 'ulnovatech@gmail.com',
  location: 'Kampala, Uganda',
  phones: ['+256 791779448', '+256 749594464', '+256 772169960'],
  primaryPhone: '+256791779448',
  whatsapp: 'https://wa.me/256749594464',
  scheduleCall: 'tel:+256791779448',
}

export const apiEndpoints = {
  contact: '/php/contactus.php',
  order: `${import.meta.env.VITE_API_URL}/order.php`,
  paymentInit: `${import.meta.env.VITE_API_URL}/payment-init.php`,
  paymentVerify: `${import.meta.env.VITE_API_URL}/payment-verify.php`,
  packages: `${import.meta.env.VITE_API_URL}/packages.php`,
  portfolioDetail: `${import.meta.env.VITE_API_URL}/portfolio-detail.php`,
  portfolios: `${import.meta.env.VITE_API_URL}/portfolios.php`,
}
