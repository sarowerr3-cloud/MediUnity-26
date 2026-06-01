import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import { footerStyles } from "../../assets/dummyStyles";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: "Home", href: "/" },
    { name: "Doctors", href: "/doctors" },
    { name: "Appointments", href: "/appointments" },
    { name: "Community Forum", href: "/forum" },
    { name: "Health Hub", href: "/articles" },
    { name: "Recovery Logs", href: "/journals" },
    { name: "Health Tracker", href: "/health-tracker" },
    { name: "Symptom Checker", href: "/symptom-checker" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
  ];

  const socialLinks = [
    { Icon: Facebook, href: "https://facebook.com", name: "Facebook", color: footerStyles.facebookColor },
    { Icon: Twitter, href: "https://twitter.com", name: "Twitter", color: footerStyles.twitterColor },
    { Icon: Instagram, href: "https://instagram.com", name: "Instagram", color: footerStyles.instagramColor },
    { Icon: Linkedin, href: "https://linkedin.com", name: "LinkedIn", color: footerStyles.linkedinColor },
    { Icon: Youtube, href: "https://youtube.com", name: "YouTube", color: footerStyles.youtubeColor },
  ];

  return (
    <footer className={footerStyles.footerContainer}>
      <div className={footerStyles.mainContent}>
        {/* Navigation Links */}
        <div className={footerStyles.linksList}>
          {links.map((link, idx) => (
            <Link
              key={idx}
              to={link.href}
              className={footerStyles.quickLink}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Divider / Social & Copyright */}
        <div className={footerStyles.bottomSection}>
          {/* Copyright & Info */}
          <div className={footerStyles.copyright}>
            <span>© {currentYear} Mediunity. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Your Healthcare Solution</span>
          </div>

          {/* Social Icons */}
          <div className={footerStyles.socialContainer}>
            {socialLinks.map(({ Icon, href, name, color }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${footerStyles.socialIcon} ${color}`}
                aria-label={name}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
