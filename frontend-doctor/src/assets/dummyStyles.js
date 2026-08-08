// assets/dummyStyles.js

export const appointmentPageStyles = {
  // Main container styles
  pageContainer: "min-h-screen font-serif bg-linear-to-br from-med-lightest to-med-light py-10 px-4",
  maxWidthContainer: "max-w-6xl mx-auto",
  
  // Title styles
  doctorTitle: "text-3xl font-bold text-med-dark text-center mb-6",
  serviceTitle: "text-3xl font-bold text-med-dark text-center mb-6",
  
  // Loading and empty states
  loadingText: "text-center text-med-vibrant py-4",
  serviceLoadingText: "text-center text-med-vibrant py-4",
  emptyStateText: "text-center text-med-vibrant py-4",
  serviceEmptyStateText: "text-center text-med-vibrant py-4",
  
  // Grid layouts
  doctorGrid: "grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12",
  serviceGrid: "grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-10",
};

export const cardStyles = {
  // Doctor appointment card
  doctorCard: "bg-white/70 backdrop-blur-md border border-med-soft/20 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_0_25px_rgba(14,165,233,0.18)] hover:border-med-soft/50 transform hover:-translate-y-2.5 transition-all duration-500 flex flex-col items-center",
  serviceCard: "bg-white/70 backdrop-blur-md border border-med-soft/20 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_0_25px_rgba(14,165,233,0.18)] hover:border-med-soft/50 transition-all duration-500",
  
  // Image containers
  doctorImageContainer: "w-28 h-28 rounded-full border-2 border-med-soft/30 shadow-[0_0_15px_rgba(14,165,233,0.12)] bg-med-lightest flex items-center justify-center overflow-hidden transition-all duration-500 hover:border-med-soft hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]",
  serviceImageContainer: "w-28 h-28 rounded-full border-2 border-med-soft/30 mx-auto bg-med-lightest flex items-center justify-center overflow-hidden transition-all duration-500 hover:border-med-soft hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]",
  
  // Images
  image: "w-full h-full object-cover",
  
  // Text styles
  doctorName: "text-xl md:text-sm xl:text-md lg:text-lg font-semibold mt-4 text-center whitespace-normal break-words",
  serviceName: "text-xl md:text-sm lg:text-md xl:text-lg font-semibold text-center mt-4",
  specialization: "text-sm text-med-dark mt-1",
  price: "text-center text-med-dark font-semibold text-lg mt-2",
  
  // Date and time containers
  dateContainer: "mt-4 rounded-full border bg-white/40 border-med-soft/20 py-1.5 px-4 w-full flex justify-center gap-2 text-xs font-semibold tracking-wider text-med-dark transition-colors duration-300 hover:border-med-soft/40",
  serviceDateContainer: "mt-4 rounded-full border bg-white/40 border-med-soft/20 py-1.5 px-4 flex justify-center gap-2 text-xs font-semibold tracking-wider text-med-dark transition-colors duration-300 hover:border-med-soft/40",
  timeContainer: "mt-2 rounded-full border bg-white/40 border-med-soft/20 py-1.5 px-4 w-full flex justify-center gap-2 text-xs font-semibold tracking-wider text-med-dark transition-colors duration-300 hover:border-med-soft/40",
  serviceTimeContainer: "mt-2 rounded-full border bg-white/40 border-med-soft/20 py-1.5 px-4 flex justify-center gap-2 text-xs font-semibold tracking-wider text-med-dark transition-colors duration-300 hover:border-med-soft/40",
  
  // Badges container
  badgesContainer: "mt-4 flex justify-center gap-2",
  
  // Rescheduled text
  rescheduledText: "mt-3 text-center xl:text-md text-sm text-med-dark",
  serviceRescheduledText: "mt-3 text-center xl:text-md xl:whitespace-nowrap text-sm text-med-dark",
  rescheduledSpan: "font-semibold xl:line-clamp-2",
};

export const badgeStyles = {
  paymentBadge: {
    online: "px-3 py-1 rounded-full font-semibold text-xs bg-med-light text-med-dark border border-med-soft flex items-center gap-1",
    cash: "px-3 py-1 rounded-full font-semibold text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 flex items-center gap-1"
  },
  
  statusBadge: {
    completed: "px-3 py-1 rounded-full font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1",
    confirmed: "px-3 py-1 rounded-full font-semibold text-xs bg-med-light text-med-dark border border-med-soft flex items-center gap-1",
    pending: "px-3 py-1 rounded-full font-semibold text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1",
    canceled: "px-3 py-1 rounded-full font-semibold text-xs bg-red-100 text-red-700 border border-red-200 flex items-center gap-1",
    default: "px-3 py-1 rounded-full font-semibold text-xs bg-med-light text-med-dark border border-med-soft flex items-center gap-1"
  }
};

// Icon size helper
export const iconSize = {
  small: "w-3",
  medium: "w-4"
};

// assets/dummyStyles.js

export const bannerStyles = {
  // Banner container styles
  bannerContainer: "relative w-full max-w-7xl mx-auto my-12 px-4",
  
  // Main container with animated border
  mainContainer: "relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden group bg-gradient-to-br from-[#FAFDFF] via-[#F0F9FF] to-[#E0F2FE] border border-med-light/50",
  
  // Border outline styles
  borderOutline: "absolute inset-0 rounded-3xl p-[3px] pointer-events-none",
  outerAnimatedBand: "absolute inset-0 rounded-3xl bg-gradient-to-r from-med-vibrant via-cyan-400 to-med-soft animate-[spin_4s_linear_infinite] opacity-60",
  innerWhiteBorder: "absolute inset-0.5 rounded-3xl bg-white",
  
  // Content container
  contentContainer: "relative z-20 p-6 sm:p-8 md:p-10 lg:p-12",
  
  // Layout styles
  flexContainer: "flex flex-col lg:flex-row items-center justify-between gap-8",
  leftContent: "flex-1 text-center lg:text-left",
  rightImageSection: "flex-1 relative w-full",
  
  // Header with badge
  headerBadgeContainer: "flex flex-col lg:flex-row items-center justify-center lg:justify-start mb-4 lg:mb-6 gap-4",
  stethoscopeContainer: "relative",
  stethoscopeInner: "relative bg-gradient-to-br from-med-soft to-med-vibrant p-3 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] transform -rotate-6 hover:rotate-0 transition-transform duration-300",
  stethoscopeIcon: "w-7 h-7 text-white",
  
  // Title styles
  titleContainer: "font-[pacifico]",
  title: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-1",
  titleGradient: "text-transparent bg-gradient-to-r from-med-vibrant to-med-vibrant bg-clip-text",
  
  // Stars
  starsContainer: "flex items-center justify-center lg:justify-start mt-1",
  starsInner: "flex gap-1",
  starIcon: "w-4 h-4 fill-yellow-400 text-yellow-400",
  
  // Tagline
  tagline: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-light text-gray-700 mb-5 leading-tight",
  taglineHighlight: "text-med-vibrant font-semibold",
  
  // Features grid
  featuresGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-sm sm:text-base",
  featureItem: "flex items-center justify-center lg:justify-start bg-white/60 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-med-soft/10 hover:border-med-soft/30 hover:shadow-[0_0_15px_rgba(14,165,233,0.1)] transition-all duration-300",
  featureIcon: "w-5 h-5 text-white mr-3",
  featureText: "text-gray-700 font-medium",
  
  // Feature border colors
  featureBorderGreen: "border-med-light",
  featureBorderBlue: "border-med-light",
  featureBorderEmerald: "border-med-light",
  featureBorderPurple: "border-purple-100",
  
  // CTA Buttons container
  ctaButtonsContainer: "flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start",
  
  // Book appointment button
  bookButton: "group relative lg:whitespace-nowrap bg-gradient-to-r from-med-vibrant to-med-soft text-white px-7 py-3.5 sm:px-8 sm:py-4 rounded-full font-bold tracking-wider transform transition-all duration-300 shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:shadow-[0_0_25px_rgba(14,165,233,0.45)] hover:scale-[1.03] active:scale-95 overflow-hidden text-sm sm:text-base",
  bookButtonOverlay: "absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000",
  bookButtonContent: "relative flex items-center justify-center gap-2",
  bookButtonIcon: "w-4 h-4 sm:w-5 sm:h-5",
  
  // Emergency call button
  emergencyButton: "group border border-red-500/20 lg:whitespace-nowrap text-red-600 bg-red-500/10 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full font-bold tracking-wider transform transition-all duration-300 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-[1.03] active:scale-95 text-sm sm:text-base",
  emergencyButtonContent: "flex items-center justify-center gap-2",
  emergencyButtonIcon: "w-4 h-4 sm:w-5 sm:h-5",
  
  // Image section
  imageContainer: "relative w-full max-w-md mx-auto",
  imageFrame: "relative transform transition-transform duration-500 overflow-hidden rounded-3xl shadow-xl border border-med-light/40",
  image: "w-full object-cover h-56 sm:h-72 md:h-96 lg:h-[360px] xl:h-[420px] transition-transform duration-700"
};

export const commonStyles = {
  // Common utility styles can be added here for reuse across components
  textCenter: "text-center",
  textLeft: "text-left",
  flexCol: "flex flex-col",
  flexRow: "flex flex-row",
  itemsCenter: "items-center",
  justifyCenter: "justify-center",
  justifyStart: "justify-start",
  gap4: "gap-4",
  mb4: "mb-4",
  mb6: "mb-6"
};


// dummyStyles.js - Centralized CSS styles for all components

export const certificationStyles = {
  // Container styles
  container: "relative py-6 bg-linear-to-brfrom-med-lightest via-med-lightest to-med-lightest overflow-hidden",
  
  // Background styles
  backgroundGrid: "absolute inset-0",
  topLine: "absolute top-0 left-0 w-full h-1 bg-linear-to-br from-transparent via-med-vibrant to-transparent opacity-60",
  gridContainer: "absolute inset-0 opacity-[0.02]",
  grid: "grid grid-cols-12 gap-4 w-full h-full",
  gridCell: "border border-med-soft rounded",
  
  // Content wrapper
  contentWrapper: "relative max-w-7xl mx-auto px-2 sm:px-6 lg:px-8",
  
  // Heading styles
  headingContainer: "text-center mb-12",
  headingInner: "relative inline-block",
  leftLine: "absolute -left-20 top-1/2 w-16 h-0.5 bg-linear-to-br from-transparent to-med-vibrant",
  rightLine: "absolute -right-20 top-1/2 w-16 h-0.5 bg-linear-to-br from-transparent to-med-vibrant",
  title: "text-3xl lg:text-6xl font-serif text-gray-900 mb-4 tracking-tight",
  titleText: "bg-linear-to-br from-med-vibrant via-med-vibrant to-med-vibrant bg-clip-text text-transparent",
  subtitle: "text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light tracking-wide",
  badgeContainer: "inline-flex items-center px-5 py-2.5 bg-med-vibrant/10 border border-med-vibrant/30 rounded-full mt-6 backdrop-blur-sm",
  badgeDot: "w-2.5 h-2.5 bg-med-vibrant rounded-full animate-pulse mr-3",
  badgeText: "text-med-dark font-semibold tracking-wide text-sm",
  
  // Logos container
  logosContainer: "relative mb-10",
  logosInner: "relative p-4 mx-auto max-w-9xl",
  logosFlexContainer: "flex overflow-hidden",
  logosMarquee: "flex animate-marquee-single whitespace-nowrap py-3",
  logoItem: "inline-flex flex-col items-center mx-10 transform transition-all duration-500 group",
  logoImage: "w-16 h-16 object-contain filter transition-all duration-500",
  logoText: "mt-3 font-serif italic text-sm font-semibold text-gray-700 text-center max-w-[120px] leading-tight group-hover:text-med-dark transition-colors duration-300",
  
  // Animation keyframes and class (to be added via style tag)
  animationStyles: `
    @keyframes marquee-single {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-33.333%);
      }
    }
    .animate-marquee-single {
      animation: marquee-single 60s linear infinite;
    }
  `
};

// Add to existing dummyStyles.js

export const contactPageStyles = {
  // Page container
  pageContainer: "min-h-screen bg-linear-to-br from-med-light via-white to-med-lightest py-12 px-4 sm:px-6 md:px-8 lg:px-20 font-serif relative overflow-hidden",
  
  // Background accents
  bgAccent1: "hidden md:block absolute top-20 left-10 w-72 h-72 bg-med-soft rounded-full blur-3xl opacity-18 animate-pulse",
  bgAccent2: "hidden lg:block absolute bottom-0 right-10 w-96 h-96 bg-med-vibrant rounded-full blur-3xl opacity-10 animate-spin-slow",
  
  // Grid and layout
  gridContainer: "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start",
  
  // Form container
  formContainer: "relative bg-white/60 backdrop-blur-sm shadow-2xl rounded-3xl border border-med-soft p-6 sm:p-8 md:p-10 transition-all",
  
  // Text styles
  formTitle: "text-3xl sm:text-4xl font-extrabold text-med-dark mb-2",
  formSubtitle: "text-sm sm:text-md text-med-dark mb-6 italic",
  
  // Form layout
  formGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  formSpace: "space-y-5",
  
  // Labels
  label: "text-med-dark text-sm font-semibold flex items-center gap-2",
  
  // Inputs
  input: "w-full px-4 py-2 mt-1 border border-med-soft bg-med-lightest/40 rounded-full focus:outline-none focus:ring-2 focus:ring-med-vibrant transition-shadow text-sm sm:text-base",
  textarea: "w-full px-4 py-2 mt-1 border border-med-soft bg-med-lightest/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-med-vibrant transition-shadow text-sm sm:text-base",
  
  // Error messages
  error: "text-xs text-rose-500 mt-1",
  
  // Button container
  buttonContainer: "flex flex-col md:flex-row items-center gap-3",
  button: "w-full md:w-auto flex items-center gap-2 justify-center bg-med-vibrant text-white px-5 py-2 rounded-full shadow-lg transition-transform active:scale-95",
  sentMessage: "text-med-dark italic text-sm animate-pulse",
  
  // Info container
  infoContainer: "space-y-6",
  infoCard: "bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl border border-med-light",
  infoTitle: "text-xl sm:text-2xl font-bold mb-2",
  infoText: "text-sm sm:text-md",
  infoItem: "mt-3 flex items-center gap-2 text-sm sm:text-md",
  
  // Map
  map: "w-full h-56 sm:h-64 md:h-72 lg:h-72 rounded-3xl shadow-2xl border-2 border-med-soft hover:shadow-med-vibrant transition-all duration-500",
  
  // Hours container
  hoursContainer: "bg-linear-to-br from-med-soft to-med-light rounded-2xl p-4 shadow-inner border border-med-soft",
  hoursTitle: "text-lg sm:text-xl font-semibold mb-1",
  hoursText: "text-gray-700 text-sm sm:text-md",
  
  // Animation keyframes
  animationKeyframes: `
    .animate-spin-slow {
      animation: spin 15s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
};


// Add to existing dummyStyles.js file

export const doctorsPageStyles = {
  // Main container
  mainContainer: "min-h-screen bg-linear-to-br from-med-lightest to-med-light py-8 sm:py-10 px-3 sm:px-6 relative overflow-hidden",
  
  // Background shapes
  backgroundShape1: "absolute -top-40 -right-32 w-72 h-72 sm:w-96 sm:h-96 bg-med-soft rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse",
  backgroundShape2: "absolute -bottom-40 -left-32 w-72 h-72 sm:w-96 sm:h-96 bg-med-soft rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse animation-delay-2000",
  
  // Wrapper
  wrapper: "max-w-7xl mx-auto relative z-10 font-serif",
  
  // Header
  headerContainer: "text-center mb-8 sm:mb-10 animate-fade-in",
  headerTitle: "text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-med-dark to-med-vibrant bg-clip-text text-transparent mb-3 tracking-tight",
  headerSubtitle: "text-sm sm:text-base text-med-dark font-light",
  
  // Search bar
  searchContainer: "flex justify-center mb-8 sm:mb-12 animate-slide-up",
  searchWrapper: "relative w-full max-w-xl transition-all duration-500 px-2 sm:px-0",
  searchInput: "w-full py-3 sm:py-4 pl-12 pr-10 text-sm sm:text-lg rounded-full border border-med-soft bg-white/90 text-med-dark placeholder-teal-400 shadow-md sm:shadow-lg focus:outline-none focus:ring-2 focus:ring-med-vibrant/40 focus:shadow-xl transition-all duration-300 hover:shadow-2xl",
  searchIcon: "absolute left-4 top-3 sm:top-4 text-med-vibrant w-5 h-5 sm:w-6 sm:h-6",
  clearButton: "absolute right-3 top-3 sm:top-4 text-med-vibrant hover:text-med-dark transition",
  
  // Error area
  errorContainer: "text-center mb-6",
  errorText: "text-sm text-rose-600 mb-2",
  retryButton: "px-4 py-2 rounded-full bg-med-vibrant text-white",
  
  // Loading skeleton
  skeletonGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8",
  skeletonCard: "animate-pulse bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 md:p-6 text-center transition-all duration-300",
  skeletonImage: "relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-36 lg:h-36 bg-med-light rounded-full",
  skeletonName: "h-5 bg-med-light rounded w-3/4 mx-auto mb-2",
  skeletonSpecialization: "h-4 bg-med-light rounded w-1/2 mx-auto mb-3",
  skeletonButton: "h-8 bg-med-light rounded w-full mx-auto mt-4",
  
  // Doctors grid
  doctorsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 sm:gap-8 transition-all duration-300",
  
  // Doctor card
  doctorCard: "bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 md:p-6 text-center transition-all duration-300 hover:shadow-xl animate-fade-in-up",
  doctorCardUnavailable: "opacity-80",
  
  // Doctor image container
  imageContainer: "relative mx-auto mb-4 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-36 lg:h-36",
  imageContainerUnavailable: "opacity-70 cursor-not-allowed",
  doctorImage: "w-full h-full rounded-full object-cover border-4 border-med-soft shadow-lg transform transition-transform duration-300 group-hover:scale-105",
  doctorImageUnavailable: "border-4 border-gray-300 shadow-md",
  
  // Doctor info
  doctorName: "text-base sm:text-lg md:text-md lg:text-lg font-bold text-med-dark mb-1 whitespace-normal break-words",
  doctorSpecialization: "text-sm sm:text-sm md:text-sm text-med-vibrant font-medium mb-3",
  
  // Experience badge
  experienceBadge: "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 bg-med-lightest border border-med-soft shadow-sm",
  experienceIcon: "w-4 h-4",
  
  // Book button (available)
  bookButton: "w-full inline-flex items-center justify-center gap-2 py-2 rounded-full font-medium transition-all duration-300 text-sm bg-linear-to-r from-med-soft to-med-vibrant text-white hover:shadow-lg",
  bookButtonIcon: "w-5 h-5",
  
  // Not available button
  notAvailableButton: "w-full inline-flex items-center justify-center gap-2 py-2 rounded-full font-medium bg-gray-300 text-gray-600 cursor-not-allowed text-sm",
  notAvailableIcon: "w-5 h-5",
  
  // No results
  noResults: "col-span-full text-center py-10 text-med-dark font-medium text-base animate-fade-in",
  
  // Show more button
  showMoreContainer: "flex justify-center mt-8 sm:mt-10",
  showMoreButton: "flex items-center cursor-pointer gap-2 px-5 py-2.5 bg-linear-to-r from-med-vibrant to-med-vibrant text-white rounded-full text-md font-semibold shadow-md hover:shadow-lg transition-all duration-300",
  showMoreIcon: "w-5 h-5",
  
  // Link focus styles
  focusRing: "focus:outline-none focus:ring-2 focus:ring-med-soft rounded-full",
  
  // Animation styles
  animationFadeIn: "animate-fade-in",
  animationFadeInUp: "animate-fade-in-up",
  animationSlideUp: "animate-slide-up"
};



// Footer styles
export const footerStyles = {
  // Main container (Social Site styling)
  footerContainer: "bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300",
  mainContent: "max-w-6xl mx-auto flex flex-col items-center gap-6",
  linksList: "flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-slate-500 dark:text-slate-400 font-medium",
  quickLink: "hover:text-med-vibrant transition-colors duration-200",
  bottomSection: "w-full border-t border-slate-200/60 dark:border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs",
  copyright: "flex flex-wrap items-center justify-center gap-2 text-slate-400 dark:text-slate-500",
  socialContainer: "flex items-center gap-4",
  socialIcon: "text-slate-400 hover:text-med-vibrant dark:text-slate-500 dark:hover:text-med-vibrant transition-colors duration-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full",
  
  // Keep colors just in case
  facebookColor: "hover:text-blue-600",
  twitterColor: "hover:text-sky-500",
  instagramColor: "hover:text-pink-600",
  linkedinColor: "hover:text-blue-700",
  youtubeColor: "hover:text-red-600",
};


// Add to existing dummyStyles.js

export const homeDoctorsStyles = {
  // Section container
  section: "py-10 bg-linear-to-br from-med-lightest to-med-lightest",
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  
  // Header
  header: "text-center mb-10",
  title: "text-4xl md:text-5xl font-serif italic text-gray-900",
  titleSpan: "text-med-vibrant font-semibold",
  subtitle: "mt-2 text-gray-600 max-w-2xl mx-auto",
  
  // Error/Retry
  errorContainer: "text-center mb-6",
  errorText: "text-sm text-rose-600 mb-2",
  retryButton: "px-4 py-2 rounded-full bg-med-vibrant text-white",
  
  // Loading skeleton
  skeletonGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8",
  skeletonCard: "animate-pulse bg-white rounded-3xl shadow-md p-4 h-72",
  skeletonImage: "bg-med-light rounded-lg h-40 mb-4",
  skeletonText1: "h-5 bg-med-light rounded w-3/4 mb-2",
  skeletonText2: "h-4 bg-med-light rounded w-1/2 mb-3",
  skeletonButton: "h-8 w-full bg-med-light rounded",
  
  // Doctors grid
  doctorsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8",
  
  // Doctor card
  article: "group relative bg-white rounded-3xl shadow-md hover:shadow-2xl transition transform duration-300 overflow-hidden",
  
  // Image containers
  imageContainerAvailable: "relative h-60 sm:h-44 md:h-48 lg:h-52 overflow-hidden rounded-t-3xl",
  imageContainerUnavailable: "relative h-60 sm:h-44 md:h-48 lg:h-52 overflow-hidden rounded-t-3xl opacity-80 cursor-not-allowed",
  image: "w-full h-full object-cover object-center transform transition-transform duration-500",
  unavailableBadge: "absolute top-3 left-3 bg-rose-50 text-rose-700 text-xs px-2 py-1 rounded-full shadow",
  
  // Card body
  cardBody: "p-3 sm:p-4 md:p-5 font-serif",
  doctorName: "text-base sm:text-lg md:text-sm lg:text-md xl:text-xl font-semibold text-black",
  specialization: "text-sm sm:text-sm md:text-sm text-med-vibrant font-medium mt-1",
  
  // Experience badge
  experienceContainer: "mt-3 flex items-center justify-between text-sm text-gray-600",
  experienceBadge: "flex items-center gap-2 border border-med-soft bg-med-light px-2 py-1 rounded-full text-xs sm:text-sm",
  
  // Buttons
  buttonContainer: "mt-3",
  buttonAvailable: "w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-full font-medium transition-all duration-300 text-sm bg-linear-to-br from-med-soft to-med-vibrant text-white hover:shadow-lg",
  buttonUnavailable: "w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-full font-medium bg-gray-300 text-gray-600 cursor-not-allowed text-sm",
  
  // Custom CSS
  customCSS: `
    /* keep your shadow look consistent */
    .shadow-md { box-shadow: 0 6px 18px rgba(14, 30, 37, 0.06); }
    .shadow-2xl { box-shadow: 0 18px 50px rgba(14, 30, 37, 0.12); }

    /* optional: slightly reduce spacing on very small devices for compactness */
    @media (max-width: 420px) {
      .max-w-7xl { padding-left: 12px; padding-right: 12px; }
    }
  `
};

// Add to existing dummyStyles.js file

export const loginPageStyles = {
  // Main container
  mainContainer: "min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAFDFF] via-[#F2FAFB] to-[#E6F5F8] relative overflow-hidden",
  
  // Back button
  backButton: "absolute top-6 left-6 cursor-pointer flex items-center gap-2 text-med-dark font-semibold hover:text-med-vibrant transition-all duration-300",
  backButtonIcon: "w-5 h-5",
  
  // Login card
  loginCard: "relative z-10 bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-8 w-[90%] max-w-md border border-med-soft/20 transition-all duration-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.25)] hover:border-med-soft/40",
  
  // Logo
  logoContainer: "flex justify-center mb-6",
  logo: "w-28 h-28 object-contain drop-shadow-lg",
  
  // Header
  title: "text-3xl font-bold text-center text-med-dark tracking-wide mb-2",
  subtitle: "text-center text-med-vibrant mb-6 text-sm",
  
  // Form
  form: "space-y-5",
  
  // Input fields
  input: "w-full px-5 py-3 rounded-full border border-med-soft/25 bg-white/50 focus:outline-none focus:border-med-soft focus:ring-2 focus:ring-med-soft/20 transition-all",
  
  // Submit button
  submitButton: "w-full py-3 bg-gradient-to-r from-med-vibrant to-med-soft text-white font-semibold rounded-full hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all cursor-pointer",
  
  // Toast styles (kept in component since they're inline)
  // These remain in the component as they're JS objects, not CSS classes
  
  // Responsive adjustments
  responsiveCard: "p-8 w-[90%] max-w-md"
};

// Add to dummyStyles.js if you want to extract toast styles too

export const toastStyles = {
  errorToast: {
    borderRadius: "12px",
    background: "#fff",
    color: "#14532d",
    border: "1px solid #86efac",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  },
  successToast: {
    borderRadius: "12px",
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #6ee7b7",
    boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
    fontWeight: "600",
  }
};



// Navbar styles
export const navbarStyles = {
  // Main container
  navbarContainer: "sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-teal-500/20 transition-transform duration-500 text-white shadow-lg shadow-black/20",
  navbarHidden: "-translate-y-full",
  navbarVisible: "translate-y-0",
  
  // Border animation
  navbarBorder: "navbar-border",
  
  // Content wrapper
  contentWrapper: "max-w-7xl md:px-2 mx-auto px-4 sm:px-6 lg:px-8",
  flexContainer: "flex items-center justify-between h-20 gap-4",
  
  // Logo section
  logoLink: "flex items-center gap-2 sm:gap-3 -ml-1 sm:-ml-2 flex-shrink-0",
  logoContainer: "relative group w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 xl:w-20 xl:h-20",
  logoImageWrapper: "relative flex items-center justify-center overflow-hidden p-1.5 h-full w-full",
  logoImage: "w-14 h-14 sm:w-18 sm:h-18 lg:w-14 lg:h-14 xl:w-18 xl:h-18 object-contain",
  logoTextContainer: "block",
  logoTitle: "text-lg sm:text-xl lg:text-lg xl:text-xl font-bold text-white tracking-tight",
  logoSubtitle: "text-[9px] sm:text-[10px] lg:text-[9px] xl:text-[10px] text-white/70",
  
  // Desktop navigation
  desktopNav: "hidden xl:flex items-center gap-2 flex-shrink-0",
  navItemsContainer: "flex gap-0.5 bg-slate-900/60 border border-teal-500/20 p-0.5 rounded-full shadow-lg",
  navItem: "nav-item px-3 xl:px-4 py-2 rounded-full text-xs xl:text-[13px] font-semibold transition-all duration-300",
  navItemActive: "active",
  navItemInactive: "text-white/80 hover:text-white",
  
  // Right side
  rightContainer: "flex items-center gap-2 xl:gap-3 flex-shrink-0",
  
  // Signed out buttons
  doctorAdminButton: "btn-add hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-transform duration-200",
  doctorAdminIcon: "w-3.5 h-3.5",
  doctorAdminText: "hidden xl:inline-block xl:text-xs xl:whitespace-nowrap",
  loginButton: "btn-login hidden xl:flex text-xs xl:text-sm items-center gap-2 bg-med-soft text-white px-5 py-2.5 rounded-full font-semibold hover:shadow-xl transition-all duration-300 cursor-default hover:scale-[1.03] active:scale-95",
  loginIcon: "w-3.5 h-3.5",
  
  // Mobile toggle
  mobileToggle: "xl:hidden p-2.5 rounded-lg hover:bg-white/10 transition-colors",
  toggleIcon: "w-6 h-6 text-white",
  
  // Mobile menu
  mobileMenu: "mobile-menu xl:hidden pb-4 space-y-2 border-t border-teal-500/20 pt-4 bg-slate-950/95 backdrop-blur-lg",
  mobileMenuItem: "block px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
  mobileMenuItemActive: "bg-med-soft text-white",
  mobileMenuItemInactive: "text-white/85 hover:bg-white/10 hover:text-white",
  
  // Mobile signed out buttons
  mobileDoctorAdminButton: "w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-teal-500/20 bg-slate-950 text-white text-sm font-semibold hover:bg-white/10 transition-all",
  mobileLoginContainer: "w-full mt-3",
  mobileLoginButton: "w-full cursor-default md:rounded-full flex items-center justify-center gap-2 bg-med-soft text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all",
  
  // Animation styles (to be added via style tag)
  animationStyles: `
    @keyframes borderFlow {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    .navbar-border {
      height: 2px;
      background: linear-gradient(90deg, var(--med-dark), var(--med-soft), var(--med-lightest), var(--med-dark));
      background-size: 300% 100%;
      animation: borderFlow 6s ease infinite;
    }
    .nav-item {
      animation: slideIn 0.45s ease-out forwards;
      position: relative;
    }
    .nav-item.active {
      background: rgba(255, 255, 255, 0.15) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .nav-item.active::after {
      content: "";
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      background: var(--med-soft) !important;
      border-radius: 9999px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
      50% {
        opacity: 0.5;
        transform: translateX(-50%) scale(1.25);
      }
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Add button styles */
    .btn-add {
      background-image: linear-gradient(var(--med-dark), var(--med-dark)), linear-gradient(90deg, var(--med-dark), var(--med-soft), var(--med-dark));
      background-origin: padding-box, border-box;
      background-clip: padding-box, border-box;
      border: 2px solid transparent;
      border-radius: 9999px;
      color: white !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transform: translateZ(0);
    }
    .btn-add:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .btn-login {
      animation: glow 2.2s ease-in-out infinite;
    }
    @keyframes glow {
      0%,
      100% {
        box-shadow: 0 0 20px rgba(37, 166, 164, 0.22),
          0 4px 12px rgba(37, 166, 164, 0.12);
      }
      50% {
        box-shadow: 0 0 32px rgba(37, 166, 164, 0.36),
          0 6px 22px rgba(37, 166, 164, 0.18);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        height: 0;
      }
      to {
        opacity: 1;
        height: auto;
      }
    }
    .mobile-menu {
      animation: fadeIn 0.28s ease-out;
    }
  `
};

// Add to existing dummyStyles.js

export const servicePageStyles = {
  // Page container
  pageContainer: "min-h-screen py-12 px-6 lg:px-20 font-serif bg-linear-to-b from-med-lightest to-white",
  maxWidthContainer: "max-w-6xl mx-auto",
  
  // Header
  header: "mb-10 text-center",
  title: "text-4xl font-bold text-med-dark",
  subtitle: "mt-2 text-med-dark/80",
  
  // Error/Retry
  errorContainer: "text-center mb-6",
  errorText: "text-sm text-rose-600 mb-2",
  retryButton: "px-4 py-2 rounded-full bg-med-vibrant text-white",
  
  // Loading skeleton
  skeletonGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8",
  skeletonCard: "animate-pulse group rounded-2xl overflow-hidden bg-white shadow-xl p-4",
  skeletonImage: "w-full h-48 bg-med-light rounded mb-4",
  skeletonText1: "h-5 bg-med-light rounded w-3/4 mb-2",
  skeletonText2: "h-4 bg-med-light rounded w-1/2 mb-4",
  skeletonButton: "h-10 bg-med-light rounded w-full",
  
  // Services grid
  servicesGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8",
  
  // Empty state
  emptyState: "col-span-full text-center py-10 text-med-dark font-medium text-base",
};

export const serviceCardStyles = {
  // Card container
  card: "group rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_0_25px_rgba(14,165,233,0.18)] hover:-translate-y-2 hover:border-med-soft/40 transition-all duration-500 border border-med-light",
  
  // Image container
  imageContainer: "w-full overflow-hidden bg-med-lightest/30 flex items-center justify-center",
  
  // Images
  picture: "w-full",
  responsiveImage: "w-full h-40 sm:h-48 md:h-56 lg:h-60 object-cover object-center transform group-hover:scale-105 transition-transform duration-500",
  fallbackImage: "w-full h-60 sm:h-48 md:h-56 lg:h-60 object-cover object-center transform transition-transform duration-500",
  
  // Content
  content: "p-5 text-center",
  serviceName: "text-lg md:text-sm font-semibold font-serif text-med-dark whitespace-normal break-words",
  
  // Buttons
  buttonContainer: "mt-4",
  buttonAvailable: "inline-flex items-center justify-center gap-2 px-5 py-2.5 w-full rounded-full bg-gradient-to-r from-med-vibrant to-med-soft text-white font-semibold tracking-wider text-xs uppercase hover:scale-[1.03] transition-all duration-300 shadow-[0_4px_15px_rgba(14,165,233,0.2)] hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-95 cursor-pointer",
  buttonUnavailable: "px-5 py-2.5 w-full flex items-center justify-center gap-2 rounded-full bg-gray-200 text-gray-500 cursor-not-allowed border",
};



// Testimonial styles
export const testimonialStyles = {
  // Main container
  container: "min-h-[70vh] bg-linear-to-br from-slate-50 to-med-lightest py-10 px-4 relative overflow-hidden",
  
  // Header
  headerContainer: "max-w-6xl font-serif mx-auto text-center mb-8 sm:mb-12",
  title: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-linear-to-br from-med-vibrant to-med-vibrant mb-3",
  subtitle: "text-sm sm:text-base text-gray-600 max-w-3xl mx-auto",
  
  // Testimonial grid
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch",
  
  // Column container
  columnContainer: "relative font-serif border-2 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm",
  leftColumnBorder: "border-med-soft",
  rightColumnBorder: "border-med-soft",
  
  // Column header
  columnHeader: "py-2 font-semibold text-md sm:text-lg rounded-t-2xl text-center",
  leftColumnHeader: "bg-med-light text-med-dark",
  rightColumnHeader: "bg-med-light text-med-dark",
  
  // Scroll container
  scrollContainer: "h-56 sm:h-72 md:h-[360px] lg:h-[400px] overflow-y-hidden no-scrollbar p-3 sm:p-4",
  
  // Testimonial card
  testimonialCard: "bg-white font-[pacifico] rounded-xl shadow-lg p-4 sm:p-5 mb-4 transition-transform duration-300 border-l-4 w-full max-w-xl mx-auto",
  leftCardBorder: "border-med-vibrant hover:shadow-med-light",
  rightCardBorder: "border-med-vibrant hover:shadow-med-light",
  
  // Card content
  cardContent: "flex items-start space-x-3 sm:space-x-4",
  avatar: "w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full border border-gray-200 shadow-sm",
  textContainer: "flex-1",
  nameRoleContainer: "flex items-center justify-between gap-3",
  name: "font-semibold text-sm sm:text-base",
  leftName: "text-med-dark",
  rightName: "text-med-dark",
  role: "text-xs sm:text-sm text-gray-600",
  quote: "text-gray-700 italic text-sm sm:text-base mt-2 leading-tight",
  
  // Stars
  starsContainer: "hidden sm:flex items-center gap-1",
  mobileStarsContainer: "flex sm:hidden mt-3",
  starContainer: "inline-block",
  star: "w-4 h-4 inline-block",
  activeStar: "text-yellow-400",
  inactiveStar: "text-gray-300",
  
  // Animation styles (to be added via style tag)
  animationStyles: `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* subtle responsive tweaks */
    @media (max-width: 640px) {
      .min-h-[70vh] { min-height: auto; }
    }
    
    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  `
};

// Add to existing dummyStyles.js

export const serviceDetailStyles = {
  // Page container
  pageContainer: "min-h-screen font-serif bg-linear-to-br from-med-lightest via-white to-med-lightest px-4 lg:px-12 pt-20 sm:pt-12 md:pt-8 lg:pt-0",
  
  // Navigation bar
  navBar: "backdrop-blur-lg top-0 z-20",
  navContainer: "max-w-6xl mx-auto h-16 flex items-center justify-between px-4",
  backButton: "inline-flex items-center gap-2 px-4 py-2 bg-white text-med-vibrant border border-med-soft rounded-full hover:bg-med-lightest",
  
  // Main grid layout
  mainGrid: "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 mt-6",
  
  // Left column
  leftColumn: "space-y-8",
  
  // Image
  imageContainer: "w-full h-56 sm:h-72 md:h-96 lg:h-[65vh] xl:h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-white/50",
  image: "w-full h-full object-cover object-center transition-transform duration-500",
  
  // Details form
  detailsContainer: "bg-white p-6 rounded-2xl shadow-xl border border-med-light",
  detailsTitle: "text-lg font-semibold text-med-dark flex items-center gap-2 mb-4",
  detailsGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  
  // Input fields
  input: "px-4 py-3 rounded-full border border-med-soft focus:ring-2 focus:ring-med-soft w-full",
  invalidInput: "px-4 py-3 rounded-full border border-rose-500 focus:ring-2 focus:ring-med-soft w-full",
  emailInput: "px-4 py-3 rounded-full border border-med-soft focus:ring-2 focus:ring-med-soft w-full sm:col-span-2",
  
  // Payment method
  paymentLabel: "font-semibold text-med-dark block mb-2",
  paymentOptions: "inline-flex gap-2",
  paymentOption: (isSelected) => 
    `px-3 py-1 rounded-full cursor-pointer border ${isSelected ? "bg-med-vibrant text-white border-med-vibrant" : "bg-white text-med-dark border-med-light"}`,
  paymentInput: "hidden",
  
  // Date selection
  dateSection: "mt-4",
  dateTitle: "text-xl font-semibold text-med-dark mb-2",
  dateScrollContainer: "overflow-x-auto -mx-2 px-2",
  dateButtonsContainer: "inline-flex gap-3 sm:flex sm:flex-wrap",
  dateButton: (isSelected) => 
    `px-5 py-2 rounded-full cursor-pointer border transition whitespace-nowrap min-w-[140px] sm:min-w-0 ${isSelected ? "bg-med-vibrant border-med-vibrant text-white" : "bg-white border-med-soft text-med-dark hover:bg-med-light"}`,
  
  // Time selection
  timeSection: "mt-4",
  timeTitle: "text-xl font-semibold text-med-dark mb-2",
  timeScrollContainer: "overflow-x-auto -mx-2 px-2",
  timeButtonsContainer: "inline-flex gap-3 sm:flex sm:flex-wrap",
  timeButton: (isSelected) => 
    `px-5 py-2 rounded-full cursor-pointer border transition whitespace-nowrap min-w-[140px] sm:min-w-0 flex items-center gap-2 ${isSelected ? "bg-med-vibrant border-med-vibrant text-white" : "bg-white border-med-soft text-med-dark hover:bg-med-light"}`,
  noSlotsMessage: "text-med-vibrant/80 p-2",
  
  // Submit button
  errorMessage: "text-rose-600 mb-2",
  successMessage: "text-med-dark mb-2",
  submitButton: (isValid, isSubmitting) => 
    `w-full py-4 md:mb-8 rounded-full cursor-pointer text-lg font-semibold flex items-center justify-center gap-3 transition ${isValid && !isSubmitting ? "bg-linear-to-br from-med-vibrant to-med-vibrant text-white shadow-lg hover:opacity-90" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`,
  
  // Right column
  rightColumn: "bg-white/80 rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50 h-fit",
  serviceName: "text-2xl lg:text-3xl xl:text-3xl md:text-2xl sm:text-4xl font-bold bg-linear-to-r from-med-vibrant to-med-vibrant bg-clip-text text-transparent",
  
  // About section
  aboutContainer: "mt-6 bg-med-lightest p-5 rounded-xl border border-med-light",
  aboutTitle: "flex items-center gap-3 text-md md:text-xl lg:text-xl xl:text-xl font-semibold text-med-dark",
  aboutText: "text-med-dark mt-2",
  
  // Price display
  priceContainer: "mt-6 rounded-full flex items-center gap-3 bg-med-lightest w-fit px-5 py-3 border border-med-light",
  priceText: "font-bold text-xl text-med-dark",
  
  // Instructions
  instructionsContainer: "mt-8",
  instructionsTitle: "text-xl font-semibold text-med-dark mb-3",
  instructionsList: "list-disc pl-6 text-med-dark space-y-1",
  
  // Booking summary
  summaryContainer: "mt-8 bg-linear-to-r from-med-lightest to-med-lightest rounded-2xl p-5 border border-med-light",
  summaryTitle: "text-lg font-semibold text-med-dark mb-4",
  summaryContent: "space-y-2 text-med-dark text-sm sm:text-base",
  summaryItem: "",
  
  // Loading and error states
  loadingContainer: "min-h-screen flex items-center justify-center p-8",
  loadingCard: "bg-white p-8 rounded-xl shadow-lg text-center",
  loadingTitle: "text-2xl font-semibold",
  loadingText: "mt-2 text-gray-600",
  backToServices: "inline-block mt-4 px-4 py-2 bg-med-vibrant text-white rounded-full",
};



// DoctorDetail styles
export const doctorDetailStyles = {
  // Main container
  pageContainer: "min-h-screen font-serif bg-linear-to-br from-med-lightest via-white to-med-lightest relative overflow-hidden",
  
  // Loading/Error states
  loadingContainer: "min-h-screen flex items-center justify-center",
  errorContainer: "min-h-screen flex items-center justify-center",
  errorContent: "text-center",
  errorText: "text-red-600 mb-2",
  errorMessage: "text-gray-700",
  backButton: "inline-flex items-center gap-2 mt-4 px-6 py-3 bg-med-vibrant text-white rounded-full hover:bg-med-vibrant transition-all",
  backButtonIcon: "size={20}",
  
  // Not found state
  notFoundContainer: "min-h-screen flex items-center justify-center",
  notFoundContent: "text-center",
  notFoundEmoji: "text-6xl mb-4",
  notFoundTitle: "text-2xl font-bold text-gray-700",
  
  // Header
  headerContainer: "relative z-10 bg-white/80 backdrop-blur-lg border-b border-med-light top-0",
  headerContent: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  headerFlex: "flex items-center justify-between h-16",
  headerBackButton: "inline-flex items-center gap-2 px-2 xl:px-4 lg:px-4 py-2 bg-white text-med-vibrant border border-med-soft rounded-full hover:bg-med-lightest hover:border-med-soft transition-all duration-300 shadow-sm hover:shadow-md",
  headerBackButtonIcon: "size={18}",
  headerBackButtonText: "font-medium",
  headerTitle: "text-sm md:text-2xl lg:text-xl xl:text-2xl whitespace-nowrap font-bold bg-linear-to-r from-med-vibrant to-med-vibrant bg-clip-text text-transparent",
  headerRatingContainer: "flex items-center gap-2 px-2 py-2 bg-white rounded-full shadow-sm border border-amber-100",
  headerRatingIcon: "text-amber-400 fill-current",
  headerRatingText: "font-semibold text-amber-600",
  
  // Main content wrapper
  mainContent: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-8 transition-all duration-700",
  visibleState: "opacity-100 translate-y-0",
  hiddenState: "opacity-0 translate-y-8",
  
  // Profile card
  profileCard: "bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden mb-8",
  profileGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 sm:p-8",
  
  // Left column (avatar)
  leftColumn: "lg:col-span-1 flex flex-col items-center space-y-6",
  avatarContainer: "relative",
  avatarGlow: "absolute -inset-2 sm:-inset-3 md:-inset-6 bg-linear-to-br from-med-vibrant to-med-vibrant rounded-full blur-lg opacity-50 animate-pulse",
  avatarImage: "relative w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full object-cover border-4 sm:border-6 md:border-8 border-white shadow-2xl z-10 transition-transform duration-300",
  statsGrid: "grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 lg:grid-cols-2 gap-4 w-full max-w-lg px-2",
  statBox: "text-center p-3 sm:p-4 bg-white rounded-2xl shadow-lg border border-med-lightest hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
  statIcon: "w-5 h-5 mx-auto mb-2",
  heartIcon: "text-rose-500",
  awardIcon: "text-amber-500",
  usersIcon: "text-med-vibrant",
  statValue: "text-lg font-bold text-gray-800",
  statLabel: "text-xs text-gray-500",
  
  // Right column (doctor info)
  rightColumn: "lg:col-span-2 space-y-6",
  doctorName: "text-2xl md:text-2xl lg:text-3xl xl:text-3xl sm:text-4xl font-bold bg-linear-to-r from-med-vibrant to-med-vibrant bg-clip-text text-transparent",
  specializationBadge: "inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-med-vibrant to-med-vibrant text-white rounded-full text-sm font-semibold shadow-lg",
  badgeIcon: "w-4 h-4",
  
  // Info grid
  infoGrid: "grid grid-cols-1 lg:grid-cols-2 md:grid-cols-1 gap-4",
  infoItem: "flex items-start gap-3 md:p-3 p-4 bg-white rounded-full shadow-sm border border-med-lightest",
  infoIcon: "w-5 h-5 text-med-vibrant mt-1",
  infoLabel: "text-sm font-semibold text-med-vibrant",
  infoValue: "text-gray-700 font-medium",
  feeValue: "text-lg font-bold text-rose-600",
  
  // About section
  aboutContainer: "p-6 bg-white rounded-2xl shadow-sm border border-med-lightest",
  aboutHeader: "flex items-center gap-2 mb-4",
  aboutIcon: "w-5 h-5 text-med-vibrant",
  aboutTitle: "text-lg font-semibold text-med-dark",
  aboutText: "text-gray-600 leading-relaxed",
  
  // Appointment section
  appointmentContainer: "bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden",
  appointmentContent: "p-6 sm:p-8",
  appointmentHeader: "flex items-center gap-3 mb-6",
  appointmentIcon: "w-6 h-6 text-med-vibrant",
  appointmentTitle: "text-md md:text-2xl font-bold bg-linear-to-r from-med-vibrant to-med-vibrant bg-clip-text text-transparent",
  
  // Appointment grid
  appointmentGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  
  // Date selection
  dateSection: "space-y-6",
  dateTitle: "text-lg md:text-xl font-semibold text-med-dark flex items-center gap-2",
  dateTitleIcon: "w-5 h-5",
  dateScrollContainer: "overflow-x-auto -mx-2 px-2",
  dateButtonsContainer: "inline-grid grid-flow-col auto-cols-max gap-3 sm:grid sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-5 xl:grid-cols-6",
  dateButton: "p-2 sm:p-3 rounded-full cursor-pointer border-2 transition-all whitespace-nowrap",
  dateButtonSelected: "bg-linear-to-br from-med-vibrant to-med-vibrant text-white border-med-vibrant shadow-lg",
  dateButtonUnselected: "bg-white text-gray-700 border-med-light",
  dateContent: "text-center",
  dateWeekday: "text-xs sm:text-sm opacity-80",
  dateDay: "text-xl sm:text-2xl font-bold",
  dateMonth: "text-xs opacity-80",
  
  // Patient form
  patientForm: "bg-white rounded-2xl p-6 border border-med-light shadow-sm",
  patientFormTitle: "text-lg font-semibold text-med-dark mb-4",
  patientFormGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
  formInput: "p-3 rounded-full border border-med-soft w-full",
  emailInput: "p-3 rounded-full border border-med-soft w-full md:col-span-2",
  formSelect: "p-3 rounded-full border border-med-soft w-full",
  
  // Time slots
  timeSlotsSection: "space-y-6",
  timeSlotsTitle: "text-lg font-semibold text-med-dark flex items-center gap-2",
  timeSlotsIcon: "w-5 h-5",
  timeSlotsContainer: "flex gap-3 overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3",
  noSlotsMessage: "text-gray-500",
  timeSlotButton: "min-w-[140px] p-2 rounded-full border-2",
  timeSlotButtonSelected: "bg-linear-to-br from-med-vibrant to-med-vibrant text-white border-med-vibrant",
  timeSlotButtonUnselected: "bg-white text-gray-700 border-med-light",
  timeSlotContent: "flex items-center justify-center gap-2",
  timeSlotIcon: "w-4 h-4",
  
  // Summary section
  summaryContainer: "bg-linear-to-r from-med-lightest to-med-lightest p-4 sm:p-6 rounded-2xl border border-med-light",
  summaryItem: "space-y-3 mb-4 sm:mb-6",
  summaryRow: "flex justify-between",
  summaryLabel: "text-md text-gray-600",
  summaryValue: "font-semibold text-med-dark text-sm sm:text-base",
  feeDisplay: "font-bold text-rose-600",
  
  // Payment method
  paymentContainer: "mb-3 flex items-center gap-3",
  paymentLabel: "text-sm font-medium text-med-dark",
  paymentOptions: "inline-flex gap-2",
  paymentOption: "px-3 py-1 rounded-full cursor-pointer border",
  paymentOptionSelected: "bg-med-vibrant text-white border-med-vibrant",
  paymentOptionUnselected: "bg-white text-med-dark border-med-light",
  paymentRadio: "hidden",
  
  // Booking button
  bookingButton: "w-full py-3 sm:py-4 px-4 rounded-full font-semibold text-sm cursor-pointer transition-all",
  bookingButtonEnabled: "bg-linear-to-r from-med-vibrant to-med-vibrant text-white",
  bookingButtonDisabled: "bg-gray-300 text-gray-500",
  bookingButtonContent: "flex items-center justify-center gap-3",
  bookingIcon: "w-5 h-5",
  
  // Toast container
  toastContainer: "ToastContainer"
};



export const navbarStylesDr = {
  // Main navbar
  navContainer: "fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full md:max-w-2xl lg:max-w-4xl pl-4 pr-8 py-1 rounded-full glass-panel flex items-center justify-between gap-3 transition-all duration-300 hover:-translate-y-0.5 border border-slate-300 dark:border-slate-700 shadow-sm",
  
  // Left brand section
  leftBrand: "flex items-center gap-3",
  logoContainer: "w-24 h-24 flex items-center justify-center rounded-full transform transition-all duration-300 hover:rotate-1 overflow-hidden",
  logoImage: "w-full h-full object-contain p-1",
  brandTextContainer: "md:block",
  brandTitle: "text-3xl text-blue-900 dark:text-white font-bold tracking-wide",
  brandSubtitle: "text-xs text-black dark:text-white/80 font-medium",
  
  // Desktop menu
  desktopMenu: "hidden lg:flex flex-1 justify-center",
  desktopMenuItems: "flex items-center gap-2 px-2",
  
  // Link styles
  baseLink: "relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 transform",
  activeLink: "bg-blue-500/15 text-blue-900 border border-blue-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 scale-105 font-bold",
  inactiveLink: "text-black dark:text-slate-300 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:-translate-y-0.5 font-semibold",
  
  // Link content
  linkContent: "relative flex items-center gap-2",
  linkIcon: "opacity-90",
  linkText: "text-[13px]",
  
  // Right side actions
  rightActions: "flex items-center gap-3",
  
  // Logout button (desktop)
  logoutButtonDesktop: "hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm text-sm font-bold transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 cursor-pointer",
  
  // Hamburger menu buttons
  hamburgerButtonMd: "md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-black dark:text-white transition-colors",
  hamburgerButtonLg: "hidden md:flex lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-black dark:text-white transition-colors",
  
  // Mobile/tablet menu
  mobileMenuContainer: (isOpen) => 
    `lg:hidden fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md glass-panel rounded-2xl shadow-lg border border-slate-300 dark:border-slate-700 transform origin-top transition-all duration-300 ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`,
  
  mobileMenuContent: "flex flex-col p-3 gap-2",
  
  // Mobile nav links
  mobileBaseLink: "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
  mobileActiveLink: "bg-blue-500/15 text-blue-900 border border-blue-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold",
  mobileInactiveLink: "text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-900 dark:hover:text-emerald-100 font-semibold",
  
  // Mobile logout button
  mobileLogoutButton: "mt-2 px-4 py-2 rounded-full text-center bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-transform duration-150 hover:scale-105 w-full cursor-pointer",
  mobileLogoutContent: "flex items-center justify-center gap-2",
  
  // Spacer
  spacer: "h-20 lg:h-20",
  
  // Icon sizes
  iconSmall: "size={16}",
  iconMedium: "size={18}",
  iconLarge: "size={20}"
};

// ListPage styles
export const listPageStyles = {
  // Main container
  pageContainer: "min-h-screen pt-20 md:pt-25 lg:pt-25 font-sans p-4 sm:p-6 theme-doctor bg-slate-50 text-slate-900 relative overflow-hidden",
  
  // Content wrapper
  contentWrapper: "max-w-7xl mx-auto",
  
  // Header section
  headerContainer: "mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
  headerTitle: "text-2xl sm:text-3xl pt-5 md:pt-0 lg:pt-0 xl:pt-0 font-extrabold text-blue-950 font-serif",
  headerSubtitle: "text-xs sm:text-sm text-slate-700 font-bold mt-0.5",
  
  // Search and filter section
  searchFilterContainer: "flex flex-col pt-10 md:pt-0 sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto",
  searchContainer: "relative w-full sm:w-auto",
  searchIconContainer: "absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-700",
  searchIcon: "w-4 h-4",
  searchInput: "pl-10 pr-10 w-full sm:w-64 md:w-80 lg:w-96 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 outline-none font-bold text-xs shadow-xs",
  clearSearchButton: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-900 p-1 rounded-full",
  clearSearchIcon: "w-4 h-4",
  statusFilter: "text-xs font-bold px-4 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 w-full sm:w-auto outline-none cursor-pointer shadow-xs",
  
  // Loading and error states
  loadingContainer: "text-center py-8 text-slate-900 font-bold",
  errorContainer: "text-center py-8 text-rose-700 font-bold",
  
  // Appointments grid
  appointmentsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start",
  
  // Appointment card
  appointmentCard: "rounded-3xl p-5 bg-white shadow-sm hover:shadow-md flex flex-col justify-between self-start border border-slate-200 transition-all",
  
  // Card header
  cardHeader: "flex flex-col sm:flex-row items-start sm:items-center gap-3",
  cardAvatar: "w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-emerald-500 flex items-center justify-center shadow-xs shrink-0",
  cardAvatarImage: "w-full h-full object-cover",
  cardAvatarFallback: "text-blue-950 font-extrabold",
  cardContent: "flex-1 min-w-0",
  cardPatientName: "text-base font-extrabold text-blue-950 truncate",
  cardPatientInfo: "text-xs text-slate-700 mt-0.5 font-bold",
  cardDoctorInfo: "mt-1 text-xs text-slate-800 truncate font-semibold",
  cardDoctorName: "font-extrabold text-blue-900",
  cardSpeciality: "text-xs text-emerald-800 font-bold truncate mt-0.5",
  
  // Date and time section
  dateTimeSection: "mt-4 flex flex-col items-start gap-1.5",
  dateTimeContainer: "text-sm text-slate-900 font-extrabold flex items-center gap-2 w-full",
  calendarIcon: "w-4 h-4 text-blue-700 shrink-0",
  dateText: "whitespace-nowrap truncate font-extrabold text-slate-900",
  feeText: "text-xs text-emerald-800 font-extrabold",
  
  // Contact and status section
  contactStatusSection: "mt-3 flex flex-col items-start gap-2",
  phoneContainer: "text-xs text-emerald-800 flex items-center gap-2 font-bold",
  phoneIcon: "w-4 h-4 text-emerald-700 shrink-0",
  phoneNumber: "truncate font-bold text-emerald-800",
  statusContainer: "flex items-center gap-2 w-full mt-2 justify-start",
  
  // Status badge
  statusBadgeBase: "px-3 py-1 rounded-full text-xs font-bold shadow-xs",
  statusBadgeComplete: "bg-slate-100 text-slate-800 border border-slate-300 font-bold",
  statusBadgeCancelled: "bg-rose-50 text-rose-800 border border-rose-200 font-bold",
  statusBadgeConfirmed: "bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold",
  statusBadgeRescheduled: "bg-purple-50 text-purple-900 border border-purple-200 font-bold",
  statusBadgePending: "bg-amber-50 text-amber-900 border border-amber-300 animate-pulse font-bold",
  
  // Status select
  statusSelect: "text-xs font-bold px-3 py-1 rounded-full border focus:outline-none transition cursor-pointer shadow-xs",
  statusSelectEnabled: "bg-white text-slate-900 border-slate-300 hover:bg-slate-50",
  statusSelectDisabled: "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200",
  
  // Reschedule button container
  rescheduleContainer: "mt-4",
  rescheduleButton: "text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer shadow-xs",
  rescheduleButtonEnabled: "bg-white text-blue-900 border-slate-300 hover:bg-blue-50",
  rescheduleButtonDisabled: "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
  
  // Reschedule form
  rescheduleForm: "flex flex-col md:flex-col items-end gap-2 w-full",
  dateInput: "text-xs font-bold px-3 py-2 rounded-full border border-slate-300 bg-white text-slate-900 w-full md:w-40 shadow-xs",
  timeInput: "text-xs font-bold px-3 py-2 rounded-full border border-slate-300 bg-white text-slate-900 w-full md:w-36 shadow-xs",
  rescheduleButtons: "flex gap-2",
  saveButton: "text-xs px-3.5 py-1.5 rounded-full bg-blue-800 text-white font-bold hover:bg-blue-900 transition shadow-xs cursor-pointer",
  cancelButton: "text-xs px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition font-bold cursor-pointer"
};

export const editProfilePageStyles = {
  // Page container
  pageContainer: "min-h-screen font-sans bg-[var(--med-lightest)] text-black dark:text-white p-4 sm:p-5 md:p-6",
  maxWidthContainer: "max-w-6xl pt-8 md:pt-10 mx-auto relative",
  
  // Loading states
  loadingContainer: "min-h-screen flex items-center justify-center",
  loadingSpinner: "w-12 h-12 border-4 border-slate-300 border-t-blue-800 rounded-full animate-spin mx-auto mb-4",
  loadingText: "text-black font-bold",
  errorText: "text-red-600 font-bold",
  
  // Toast notifications
  toastContainer: "fixed top-3 right-2 sm:right-4 z-50 space-y-3 max-w-xs sm:max-w-sm",
  toastBase: "transform transition-all duration-300 ease-out rounded-xl shadow-lg p-3 sm:p-4 flex items-start gap-3 border border-slate-300",
  toastSuccess: "bg-white border-l-4 border-emerald-600",
  toastError: "bg-red-50 border-l-4 border-red-600",
  toastInfo: "bg-white border-l-4 border-blue-800",
  toastIcon: "w-5 h-5 mt-0.5",
  toastSuccessIcon: "text-emerald-600",
  toastErrorIcon: "text-red-600",
  toastText: "text-sm font-bold text-black",
  
  // Main card
  mainCard: "bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden border border-slate-300 dark:border-slate-700",
  headerBackground: "relative h-24 sm:h-28 md:h-32 bg-blue-900",
  
  // Profile image
  imageContainer: "absolute -bottom-16 left-1/2 transform -translate-x-1/2 md:left-8 md:transform-none",
  imageWrapper: "relative group",
  profileImage: "relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 md:ml-23 rounded-full object-cover border-4 border-white shadow-md",
  imageEditButton: (editing) => `absolute bottom-2 right-2 bg-white border border-slate-300 rounded-full p-2 shadow-md cursor-pointer transition-transform ${!editing && "cursor-not-allowed"}`,
  imageEditIcon: (editing) => `w-5 h-5 ${editing ? "text-blue-900" : "text-black/40"}`,
  imageInput: "hidden",
  
  // Profile content
  profileContent: "pt-20 pb-8 px-4 sm:px-6 md:px-8",
  profileHeader: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8",
  profileInfo: "flex-1 min-w-0",
  profileName: "text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 dark:text-white font-serif truncate",
  profileSubtitle: "text-sm sm:text-base text-black dark:text-slate-300 mt-2 flex items-center gap-2 font-semibold",
  subtitleIcon: "w-4 h-4 text-blue-900",
  
  // Stats container
  statsContainer: "mt-4 flex flex-wrap items-center gap-3",
  statItem: "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs text-sm font-semibold text-black dark:text-white",
  ratingStatItem: "flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-semibold text-black dark:text-white",
  feeStatItem: "flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-semibold text-black dark:text-white",
  statIcon: "w-4 h-4",
  statEmeraldIcon: "text-blue-900 dark:text-emerald-400",
  statAmberIcon: (field) => {
    if (field === 'star') return "w-5 h-5 text-amber-500 fill-amber-500";
    return "w-4 h-4 text-blue-900 dark:text-emerald-400";
  },
  statLabel: "text-xs text-black dark:text-slate-400 font-bold uppercase font-mono",
  statAmberLabel: "text-xs text-black dark:text-slate-400 font-bold uppercase font-mono",
  statValue: "text-sm font-bold text-black dark:text-white truncate",
  statAmberValue: "text-sm font-bold text-black dark:text-white",
  statInput: "w-20 rounded-full border px-2 py-1 text-sm bg-white text-black border-slate-300 focus:outline-none font-bold",
  statPatientsInput: "w-24 rounded-full border px-2 py-1 text-sm bg-white text-black border-slate-300 focus:outline-none font-bold",
  
  // Action buttons
  actionButtons: "flex flex-col sm:flex-row items-center gap-3",
  availabilityToggle: (isAvailable) => `flex items-center gap-3 px-4 sm:px-5 py-2 rounded-full cursor-pointer border-2 shadow-xs transition-all duration-300 ${isAvailable ? "bg-white border-emerald-500 text-black font-bold" : "bg-slate-50 border-slate-300 text-black font-semibold"} w-full sm:w-auto`,
  toggleTrack: (isAvailable) => `relative w-10 h-5 rounded-full transition-colors ${isAvailable ? "bg-emerald-600" : "bg-slate-300"}`,
  toggleThumb: (isAvailable) => `absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAvailable ? "left-6" : "left-0.5"}`,
  toggleText: (isAvailable) => `font-bold ${isAvailable ? "text-black dark:text-white" : "text-black/60 dark:text-slate-400"}`,
  
  editButton: "group relative overflow-hidden bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-full cursor-pointer shadow-sm transition-all duration-300 font-bold w-full sm:w-auto",
  editButtonContent: "relative flex items-center gap-2",
  
  // Form sections
  formSection: "mb-8",
  sectionTitle: "text-lg sm:text-xl font-bold text-blue-900 dark:text-white mb-6 flex items-center gap-2 font-serif",
  sectionIconContainer: "w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center",
  sectionIcon: "w-4 h-4 text-blue-900 dark:text-emerald-400",
  
  // Field grid
  fieldGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  fieldGroup: "group",
  fieldHeader: "flex items-center gap-3 mb-2",
  fieldIconContainer: (editing) => `p-2 rounded-full ${editing ? "bg-blue-50 text-blue-900 dark:bg-slate-800 dark:text-emerald-400" : "bg-slate-100 text-black/50"}`,
  fieldIcon: "w-4 h-4",
  fieldLabel: "text-xs font-bold text-black dark:text-slate-300 uppercase font-mono",
  
  // Input fields
  inputBase: (editing) => `w-full rounded-xl border-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${editing ? "border-slate-300 bg-white text-black focus:border-blue-900 focus:ring-1 focus:ring-blue-900" : "border-slate-200 bg-slate-50 text-black/70 cursor-not-allowed"}`,
  
  // About textarea
  aboutTextarea: (editing) => `w-full rounded-xl border-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${editing ? "border-slate-300 bg-white text-black focus:border-blue-900 focus:ring-1 focus:ring-blue-900" : "border-slate-200 bg-slate-50 text-black/70 cursor-not-allowed"}`,
  aboutCharCount: "absolute bottom-3 right-3 text-xs text-black/60 font-semibold",
  
  // Schedule section
  scheduleHeader: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
  emptySchedule: "text-center py-10 rounded-2xl border-2 border-dashed border-slate-300 bg-white dark:bg-slate-800",
  emptyScheduleIcon: "w-12 h-12 text-blue-900 mx-auto mb-3",
  emptyScheduleText: "text-black font-bold",
  emptyScheduleSubtext: "text-xs text-black/70 mt-1 font-semibold",
  
  // Schedule grid
  scheduleGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5",
  
  // Date card
  dateCard: "group relative bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-300",
  dateHeader: "flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700",
  dateIconContainer: "p-2 rounded-full bg-blue-50 dark:bg-slate-700",
  dateIcon: "w-5 h-5 text-blue-900 dark:text-emerald-400",
  dateTitle: "font-bold text-base text-blue-900 dark:text-white font-serif",
  dateSubtitle: "text-xs text-black dark:text-slate-300 font-semibold",
  dateSlotCount: "text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-black dark:text-white",
  dateDeleteButton: (editing) => `p-2 rounded-full cursor-pointer transition-colors ${editing ? "hover:bg-red-50 text-red-600" : "text-black/30 cursor-not-allowed"}`,
  dateDeleteIcon: "w-4 h-4",
  
  // Time slots
  timeSlotContainer: "space-y-3",
  timeSlotItem: "flex items-center justify-between bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-full border border-slate-300 dark:border-slate-600",
  timeSlotIcon: "w-4 h-4 text-blue-900 dark:text-emerald-400",
  timeSlotText: "font-bold text-black dark:text-white text-xs sm:text-sm",
  timeSlotDeleteButton: (editing) => `p-1.5 rounded-full cursor-pointer transition-colors ${editing ? "hover:bg-red-50 text-red-600" : "text-black/30 cursor-not-allowed"}`,
  timeSlotDeleteIcon: "w-4 h-4",
  
  // Add time slot
  addSlotContainer: "pt-3 border-t border-slate-200 dark:border-slate-700",
  addSlotInput: "flex-grow rounded-full px-3 py-2 text-xs border border-slate-300 bg-white text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900",
  addSlotButton: "p-2 rounded-full cursor-pointer bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors",
  addSlotIcon: "w-4 h-4",
  
  // Save message
  saveMessage: (type) => `px-4 py-2 rounded-lg bg-white border border-slate-300 text-black font-bold`,
  
  // Actions section
  actionsSection: "flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700",
  actionsText: "text-xs text-black font-semibold",
  actionsButtons: "flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto",
  resetButton: "px-6 py-2.5 rounded-full cursor-pointer border-2 border-slate-300 text-black hover:bg-slate-100 transition-all duration-200 font-bold w-full sm:w-auto text-center text-xs uppercase tracking-wider",
  saveButton: "group relative overflow-hidden bg-blue-800 hover:bg-blue-900 text-white px-6 py-2.5 rounded-full cursor-pointer shadow-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto text-center font-bold text-xs uppercase tracking-wider",
  saveButtonContent: "relative flex items-center gap-2 justify-center",
  saveSpinner: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin",
  
  // AddDate component styles
  addDateContainer: "flex items-center gap-2",
  addDateInput: "rounded-xl px-3 py-2 border-2 border-slate-300 bg-white text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900 text-xs sm:text-sm",
  addDateButton: "flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-900 transition-all duration-200 text-xs sm:text-sm font-bold cursor-pointer",
  addDateIcon: "w-4 h-4",
  
  // Custom animations
  customCSS: `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
  `
};

// DashboardPage styles
export const dashboardStyles = {
  // Main container
  pageContainer: "min-h-screen font-sans pt-16 lg:pt-20 md:pt-15 p-4 sm:p-6 bg-[var(--med-lightest)] text-black dark:text-white",
  
  // Content wrapper
  contentWrapper: "max-w-7xl mx-auto",
  
  // Header section
  headerContainer: "mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
  headerTitle: "text-2xl pt-10 xl:pt-0 uppercase lg:pt-0 sm:text-3xl font-bold tracking-tight text-blue-900 dark:text-white font-serif",
  headerSubtitle: "text-sm text-black dark:text-slate-300 font-semibold",
  headerInfo: "text-sm text-black dark:text-slate-300 font-semibold",
  refreshButton: "text-xs font-bold px-3 py-1.5 rounded-full bg-white text-blue-900 border border-slate-300 hover:bg-slate-50 cursor-pointer",
  
  // Stats grid
  statsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8",
  
  // Stat card
  statCard: "rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md transition-all",
  statContent: "flex items-center justify-between gap-4",
  statTextContainer: "flex-1",
  statTitle: "text-xs font-bold text-black dark:text-slate-400 uppercase font-mono",
  statValue: "mt-1 text-xl sm:text-2xl font-bold text-blue-900 dark:text-white font-serif tracking-tight",
  statIconContainer: "p-3 rounded-full border shadow-xs bg-blue-50 dark:bg-slate-700 border-slate-300 text-blue-900 dark:text-emerald-400",
  statIcon: "w-5 h-5",
  
  // Stat card accent colors
  accentTopEmerald: "from-white to-white",
  accentTopAmber: "from-white to-white",
  accentTopEmeraldLight: "from-white to-white",
  accentTopRose: "from-white to-white",
  accentBottomEmerald: "border-slate-300",
  accentBottomAmber: "border-slate-300",
  accentBottomRose: "border-slate-300",
  
  // Appointments container
  appointmentsContainer: "bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-300 dark:border-slate-700 shadow-xs",
  appointmentsHeader: "flex items-center justify-between mb-4",
  appointmentsTitle: "text-base sm:text-lg font-bold text-blue-900 dark:text-white font-serif",
  appointmentsTotal: "text-xs sm:text-sm text-black dark:text-slate-300 font-bold flex items-center gap-2",
  totalIcon: "w-4 h-4 text-blue-900",
  
  // Cards grid
  cardsGrid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start",
  
  // Appointment card
  appointmentCard: "rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 shadow-xs border border-slate-300 dark:border-slate-700 flex flex-col justify-between gap-4 hover:shadow-md transition self-start",
  cardHeader: "flex items-start gap-3",
  cardAvatar: "w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white border-2 border-emerald-500/40 flex items-center justify-center",
  cardAvatarImage: "w-full h-full object-cover",
  cardAvatarFallback: "text-blue-900 font-bold",
  cardContent: "flex-1",
  cardPatientName: "text-base font-bold text-blue-900 dark:text-white",
  cardPatientInfo: "text-xs text-black dark:text-slate-300 mt-1 font-semibold",
  cardDoctorInfo: "mt-2 text-xs text-black dark:text-slate-300 font-semibold",
  cardDoctorName: "font-bold text-blue-900 dark:text-white",
  cardSpeciality: "text-xs text-blue-900 font-bold",
  cardPhoneContainer: "mt-2 text-xs text-black flex items-center gap-2 font-semibold",
  cardPhoneIcon: "w-4 h-4 text-blue-900",
  
  // Date and time section
  dateTimeContainer: "flex items-center justify-between",
  dateText: "text-sm font-bold text-black dark:text-white",
  timeText: "text-xs font-bold text-blue-900 dark:text-slate-300",
  
  // Card footer
  cardFooter: "flex flex-col items-end gap-2",
  feeText: "text-xs text-blue-900 font-bold",
  statusContainer: "flex items-center gap-2",
  
  // Show more button
  showMoreContainer: "mt-4 flex justify-center",
  showMoreButton: "px-5 py-2 rounded-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold transition cursor-pointer",
  
  // Status badge (reusing listPageStyles but adding here for completeness)
  statusBadgeBase: "px-3 py-1 rounded-full text-xs font-bold",
  statusBadgeComplete: "bg-slate-100 text-black border border-slate-300",
  statusBadgeCancelled: "bg-red-50 text-red-700 border border-red-200",
  statusBadgeConfirmed: "bg-emerald-50 text-emerald-800 border border-emerald-300",
  statusBadgeRescheduled: "bg-purple-50 text-purple-800 border border-purple-200",
  statusBadgePending: "bg-amber-50 text-amber-800 border border-amber-300 animate-pulse",
  
  // Status select
  statusSelect: "text-xs font-bold px-3 py-1 rounded-full border focus:outline-none transition cursor-pointer",
  statusSelectEnabled: "bg-white text-black border-slate-300 hover:shadow-xs",
  statusSelectDisabled: "bg-slate-100 text-black/50 cursor-not-allowed border-slate-200",
  
  // Reschedule button
  rescheduleButton: "text-xs font-bold px-3 py-1 rounded-full border transition cursor-pointer",
  rescheduleButtonEnabled: "bg-white text-blue-900 border-slate-300 hover:bg-slate-50",
  rescheduleButtonDisabled: "bg-slate-100 text-black/40 border-slate-200 cursor-not-allowed",
  
  // Reschedule form
  rescheduleForm: "flex flex-col items-end gap-2 w-full",
  rescheduleDateInput: "text-xs font-bold px-3 py-2 rounded-full border border-slate-300 bg-white text-black w-full md:w-48 lg:w-56",
  rescheduleTimeInput: "text-xs font-bold px-3 py-2 rounded-full border border-slate-300 bg-white text-black w-full md:w-48 lg:w-56",
  rescheduleButtons: "flex gap-2",
  saveButton: "text-xs px-3.5 py-1.5 rounded-full bg-blue-800 hover:bg-blue-900 text-white font-bold transition shadow-xs cursor-pointer",
  cancelButton: "text-xs px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-black hover:bg-slate-50 transition font-bold cursor-pointer"
};