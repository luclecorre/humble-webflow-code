// =============================================================================
// DYNAMIC GRID WITH RATIO CONTROL
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
  const MOBILE_BREAKPOINT = 767;
  const wrappers = document.querySelectorAll('[data-dynamic-grid="true"]');
  
  function applyGridStyles() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    
    wrappers.forEach(wrapper => {
      const grid = wrapper.querySelector('.cms-project-grid');
      if (!grid) return;
      
      const items = grid.querySelectorAll('.cms-project-item');
      const imageCount = items.length;
      
      // Apply grid column class based on image count
      grid.classList.remove('grid-1-col', 'grid-2-col', 'grid-3-col');
      grid.classList.add(
        imageCount === 1 ? 'grid-1-col' : 
        imageCount === 2 ? 'grid-2-col' : 
        'grid-3-col'
      );
      
      const isGrid1 = imageCount === 1;
      
      // Process each image
      items.forEach(item => {
        const imageWrapper = item.querySelector('.image-wrapper-cms');
        const image = item.querySelector('.image-cms');
        
        if (!imageWrapper || !image) return;
        
        // Extract filename from src
        const filename = image.src.split('/').pop().toLowerCase();
        const altText = (image.alt || '').toLowerCase();
        
        // Check for suffixes in filename or alt text
        const hasInset = filename.includes('_inset') || altText.includes('[inset]');
        const hasCover = filename.includes('_cover') || altText.includes('[cover]');
        
        // Grid-1-col: special ratio handling
        if (isGrid1) {
          if (hasInset) {
            // Inset: 2:1 desktop / 1:1 mobile, cover
            imageWrapper.style.aspectRatio = isMobile ? '1 / 1' : '2 / 1';
            image.style.objectFit = 'cover';
            // Mobile: zoom to crop 10% each side (scale to 125% to crop 20% total)
            image.style.transform = isMobile ? 'scale(1.25)' : 'scale(1)';
          } else if (hasCover) {
            // Cover: 2:1 desktop / 1:1 mobile, cover
            imageWrapper.style.aspectRatio = isMobile ? '1 / 1' : '2 / 1';
            image.style.objectFit = 'cover';
          } else {
            // Default: natural ratio, cover
            imageWrapper.style.aspectRatio = 'auto';
            image.style.objectFit = 'cover';
          }
        } else {
          // Grid-2-col & Grid-3-col: always 1:1, always cover
          imageWrapper.style.aspectRatio = 'auto';
          image.style.objectFit = 'cover';
        }
      });
    });
  }
  
  // Initial application
  applyGridStyles();
  
  // Handle lazy-loaded images
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        applyGridStyles();
      }
    });
  });
  
  // Observe all CMS images
  document.querySelectorAll('.image-cms').forEach(img => {
    imageObserver.observe(img);
  });
  
  // Debounced resize handler
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyGridStyles, 250);
  });
});