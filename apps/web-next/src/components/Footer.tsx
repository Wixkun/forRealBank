'use client';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-800 text-gray-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            Notre Banque
          </h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-teal-300 transition">Qui sommes-nous</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Nos engagements</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Carrières</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Presse</a></li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            Produits & Services
          </h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-teal-300 transition">Comptes bancaires</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Cartes & Paiements</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Épargne & Placements</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Crédits & Prêts</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Assurances</a></li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            Aide & Support
          </h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-teal-300 transition">Centre d’aide</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Contacter un conseiller</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">FAQ</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Accessibilité</a></li>
          </ul>
        </div>

        <div>
          <h3 className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold text-lg mb-4">
            Sécurité & Légal
          </h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-teal-300 transition">Sécurité des comptes</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Protection des données</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Conditions générales</a></li>
            <li><a href="#" className="hover:text-teal-300 transition">Mentions légales</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 my-6 mx-6" />

      <div className="max-w-7xl mx-auto px-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-400 text-center md:text-left">
          © {new Date().getFullYear()}{' '}
          <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-500 bg-clip-text text-transparent font-semibold">
            ForReal
          </span>. Tous droits réservés.
        </div>

        <div className="flex space-x-4 text-gray-400">
          <a href="#" className="hover:text-teal-300 transition"><FaFacebook /></a>
          <a href="#" className="hover:text-teal-300 transition"><FaTwitter /></a>
          <a href="#" className="hover:text-teal-300 transition"><FaLinkedin /></a>
          <a href="#" className="hover:text-teal-300 transition"><FaInstagram /></a>
        </div>
      </div>
    </footer>
  );
}
