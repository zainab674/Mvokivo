import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-primary/10 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-white">Vokivo</h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Transform your customer experience with AI-powered voice agents. 
              No setup fees, no hidden costs, and no risk with our 30-day guarantee.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <a 
                  href="#features" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Features
                </a>
              </li>
              <li>
                <Link 
                  to="/pricing" 
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Vokivo. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">Support</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


