import { Github, Twitch, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: "About", href: "/about" },
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Help Center", href: "/help" },
    ],
    creators: [
      { name: "Creator Hub", href: "/creator-hub" },
      { name: "Partner Program", href: "/partners" },
      { name: "Developer API", href: "/api" },
      { name: "Creator Guidelines", href: "/guidelines" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "DMCA", href: "/dmca" },
    ],
    social: [
      { name: "GitHub", href: "https://github.com/loudtv", icon: Github },
    ],
  };

  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  L
                </span>
              </div>
              <span className="text-xl font-bold">LoudTV</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-sm">
              The next generation live streaming platform for creators and
              communities. Stream, connect, and grow your audience with powerful
              tools and analytics.
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Creators Links */}
          <div>
            <h3 className="font-semibold mb-4">Creators</h3>
            <ul className="space-y-2">
              {footerLinks.creators.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {currentYear} LoudTV. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
            <Link
              href="/status"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Status Page
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
