'use client';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('common.footer');

  return (
    <footer className="bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800 text-gray-300 border-t border-white/10">
      <div className=" px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            {t('ourBank.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('ourBank.about')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('ourBank.commitments')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('ourBank.careers')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('ourBank.press')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            {t('products.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('products.bankAccounts')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('products.cardsPayments')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('products.savingsInvestments')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('products.loansCredits')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('products.insurance')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            {t('help.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('help.center')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('help.contactAdvisor')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('help.faq')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('help.accessibility')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            {t('security.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('security.accountSecurity')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('security.dataProtection')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('security.terms')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-teal-300 transition">
                {t('security.legal')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 my-6 mx-6" />

      <div className=" px-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-400 text-center md:text-left">
          © {new Date().getFullYear()}{' '}
          <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold">
            Avenir
          </span>
          {t('copyrightSuffix')}
        </div>

        <div className="flex space-x-4 text-gray-400">
          <a href="#" className="hover:text-teal-300 transition">
            <FaFacebook />
          </a>
          <a href="#" className="hover:text-teal-300 transition">
            <FaTwitter />
          </a>
          <a href="#" className="hover:text-teal-300 transition">
            <FaLinkedin />
          </a>
          <a href="#" className="hover:text-teal-300 transition">
            <FaInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
}
