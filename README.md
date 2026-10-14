# 🌟 SoloBizCards - Digital Business Card Platform

A comprehensive digital business card platform for creating, managing, and sharing professional business cards with advanced analytics, monetization features, and seamless integration capabilities.

## ✨ Features

### 🎨 Card Creation & Design
- **Intuitive card builder** with multi-step onboarding wizard
- **Professional templates** - Classic, Modern, and Traditional designs with custom previews
- **Custom branding** with color schemes, logo uploads, and brand consistency
- **Smart QR code generation** with custom logo integration and high-quality output
- **Mobile-responsive design** optimized for all device types
- **Real-time preview** with live editing capabilities
- **Professional image downloads** with watermarked exports
- **High-resolution exports** with 2x canvas scaling for crisp quality
- **Template customization** with top-aligned layouts and professional styling

### 📊 Analytics & Tracking
- **Google Analytics 4 integration** (G-X7HE4JN1ZC) for comprehensive tracking
- **User behavior analytics** across all platform interactions
- **Conversion monitoring** for lifetime offer engagement and user actions
- **Performance metrics** and detailed engagement insights
- **Contact management** with lead tracking and export functionality
- **Revenue tracking** and commission reporting systems

### 🔗 Sharing & Distribution
- **Multiple sharing methods** - QR codes, direct links, social media, email
- **Advanced email signature generation** with customizable layouts and HTML export
- **Social media integration** - LinkedIn, Twitter, Facebook, Instagram, YouTube, TikTok
- **Professional branding** with custom domains and white-label solutions
- **vCard downloads** for seamless contact import
- **WhatsApp and SMS sharing** for instant mobile distribution

### 💰 Monetization & Business Features
- **Multi-level referral program** with commission tracking
- **Lifetime membership offers** with floating promotional system and PayPal integration
- **Accessories marketplace** for NFC cards, stickers, and professional products
- **Pro feature upgrades** with advanced customization capabilities
- **Earnings dashboard** with detailed revenue analytics
- **Member directory** with public profile listings
- **Opportunities marketplace** for business networking

### 🆕 Latest Updates & Enhancements
- **Enhanced Template System** - Updated classic template with tropical beach design
- **Improved Modal Layouts** - Top-aligned template previews for consistent presentation
- **Floating Lifetime Offer** - Animated promotional button with professional lightbox modal
- **Smart User Onboarding** - Intelligent welcome flow that adapts to existing users
- **EmailJS Integration** - Automated email notifications for new user registrations
- **Advanced Contact Forms** - Streamlined CTA sections with calendar integration
- **Professional Watermarking** - Branded image exports with attribution
- **Mobile-First Design** - Optimized responsive layouts across all components

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript for type-safe development
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS + shadcn/ui components with semantic design tokens
- **Routing**: React Router v6 with protected routes and dynamic routing
- **State Management**: TanStack Query for server state + React hooks for local state
- **Forms**: React Hook Form + Zod validation for robust form handling
- **Charts & Analytics**: Recharts for data visualization + Google Analytics 4
- **QR Code Generation**: QRCode.js with custom logo integration
- **Icons**: Lucide React icon library with 1000+ icons
- **Email Integration**: EmailJS for automated email notifications
- **Image Processing**: HTML2Canvas for card image generation and exports
- **File Handling**: React Image Crop for profile image editing
- **UI Enhancements**: Framer Motion for animations + Tailwind CSS transitions
- **Utilities**: date-fns for date handling, clsx for conditional classes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Environment Setup
The application runs entirely on the frontend with local storage for data persistence. No backend configuration required for basic functionality.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components (40+ components)
│   ├── landing/         # Landing page sections and CTAs
│   ├── dashboard/       # Dashboard-specific components
│   │   ├── card-details/    # Card editing and management
│   │   ├── card-list/       # Card listing and grid views
│   │   └── systems/         # Admin and system components
│   ├── onboarding/      # Multi-step card creation wizard
│   │   ├── forms/           # Form sections and validation
│   │   └── templates/       # Template selection components
│   └── card-display/    # Public card viewing and sharing
├── pages/               # Route components and page layouts
│   ├── dashboard/       # Protected dashboard pages
│   └── public/          # Public-facing pages
├── hooks/               # Custom React hooks for reusable logic
├── lib/                 # Utilities and helper functions
├── types/               # TypeScript type definitions
├── utils/               # Business logic and data processing
├── assets/              # Static assets (images, templates)
└── styles/              # Global CSS and theme configuration
```

## 🎯 Key Pages & Routes

### Public Routes
- `/` - Landing page with hero section, features, testimonials, and CTA
- `/onboarding` - Multi-step card creation wizard with template selection
- `/new-onboarding` - Enhanced onboarding flow with smart user detection
- `/pricing` - Comprehensive pricing plans and feature comparison
- `/members` - Public member directory with search and filtering
- `/opportunities` - Business networking and partnership opportunities
- `/earnings` - Earnings tracking and referral program information
- `/card/:cardId` - Public card display with contact actions and analytics

### Dashboard Routes (Protected)
- `/dashboard` - Main dashboard with analytics, stats, and overview
- `/dashboard/cards` - Card management with grid/list views and search
- `/dashboard/cards/:id` - Detailed card editing with tabs (Card, Edit, Settings, View)
- `/dashboard/settings` - User preferences and account management
- `/dashboard/contacts` - Lead management and contact export
- `/dashboard/referrals` - Multi-level referral tracking and earnings
- `/dashboard/accessories` - NFC products and physical accessories marketplace
- `/dashboard/support` - Help center and customer support
- `/dashboard/systems` - Admin panel with system management and analytics

## 🎨 Design System

The application uses a comprehensive design system built on:
- **Semantic color tokens** defined in `index.css`
- **Component variants** using class-variance-authority
- **Responsive design** with mobile-first approach
- **Dark/light mode** support
- **Consistent spacing** and typography scales

## 📱 Features Overview

### For End Users
1. **Quick Card Creation** - 3-minute setup process
2. **Professional Templates** - Industry-specific designs
3. **Easy Sharing** - QR codes, links, and social integration
4. **Contact Management** - Track leads and interactions
5. **Performance Analytics** - View counts and engagement metrics

### For Business Owners
1. **White-label Solutions** - Custom branding options
2. **Referral Programs** - Monetize user referrals
3. **Advanced Analytics** - Revenue and performance tracking
4. **API Integration** - Connect with existing systems
5. **Custom Domains** - Professional web presence

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new components
- Follow React functional component patterns
- Implement proper error boundaries
- Use semantic HTML and ARIA attributes
- Maintain component modularity and reusability

### State Management
- Use TanStack Query for server state
- Local state with useState/useReducer
- Context for theme and global settings
- Local storage for user preferences

### Styling
- Use Tailwind utility classes
- Leverage design system tokens
- Create component variants for reusability
- Ensure responsive design across all components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Deployment

**Using Lovable (Recommended)**

Simply open [Lovable](https://lovable.dev/projects/2b319606-231f-4cde-acb8-36f735cec2fb) and click on Share → Publish.

**Manual Deployment**

The application can be deployed to any static hosting service:
- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

Build command: `npm run build` or `bun run build`
Output directory: `dist/`

## 🌐 Custom Domain

You can connect a custom domain by navigating to Project > Settings > Domains and clicking Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@yourdomain.com or join our Discord community.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
