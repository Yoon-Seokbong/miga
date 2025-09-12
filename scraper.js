const puppeteer = require('puppeteer');

async function scrapeProduct(url) {
    const browser = await puppeteer.launch({ headless: true }); // Use headless: true for production
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Updated selectors for 1688.com based on provided HTML
        const puppeteer = require('puppeteer');

async function scrapeProduct(url) {
    const browser = await puppeteer.launch({ headless: true }); // Use headless: true for production
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Product Name: Still uncertain, need user's help
        const productName = await page.$eval('div.title-content h1', el => el.textContent.trim()).catch(() => null);
        
        // Product Price: More robust selection for the first price in the step price component
        let productPrice = null;
        try {
            const priceElement = await page.$('.price-component .price-info.currency');
            if (priceElement) {
                const priceText = await page.evaluate(el => el.textContent.trim(), priceElement);
                const match = priceText.match(/(\d+(\.\d+)?)/); // Extract numbers
                if (match) {
                    productPrice = parseFloat(match[1]);
                }
            }
        } catch (e) {
            console.warn('Could not find product price using .price-component .price-info.currency');
        }

        // Product Description: Still uncertain, need user's help
        const productDescription = await page.$eval('v-detail-z.html-description', el => el.innerHTML).catch(() => null);
        
        // Image URLs: Broader approach, looking for any img with alicdn.com in src
        const imageUrls = await page.$eval('img[src*="alicdn.com"]', images => images.map(img => img.src)).catch(() => []);

        const videoUrls = []; // Still assuming no direct video scraping for now

        console.log('Scraped Data:');
        console.log('Name:', productName);
        console.log('Description:', productDescription);
        console.log('Price:', productPrice);
        console.log('Image URLs:', imageUrls);
        console.log('Video URLs:', videoUrls);

        return {
            original: {
                productName,
                productDescription,
                productPrice,
                imageUrls,
                videoUrls
            },
            translated: { // Placeholder for translated data
                productName: '', 
                productDescription: ''
            },
            message: 'Scraped data from ' + url
        };

    } catch (error) {
        console.error('Scraping failed:', error);
        return null;
    } finally {
        await browser.close();
    }
}

const exampleUrl = 'https://detail.1688.com/offer/961120439255.html?offerId=961120439255&spm=a260k.home2025.recommendpart.1';
scrapeProduct(exampleUrl)
    .then(data => {
        if (data) {
            console.log('Scraping successful:', data);
        } else {
            console.log('Scraping failed.');
        }
    })
    .catch(console.error);
        
        // For price, get the first price displayed in the step price component
        const priceText = await page.$eval('.price-component .price-info.currency', el => el.textContent.trim()).catch(() => null);
        let productPrice = null;
        if (priceText) {
            // Extract numbers from the price text, e.g., "¥612.00" -> 612.00
            const match = priceText.match(/(\d+(\.\d+)?)/);
            if (match) {
                productPrice = parseFloat(match[1]);
            }
        }

        // Description is often complex, trying to get innerHTML of the custom tag
        const productDescription = await page.$eval('v-detail-z.html-description', el => el.innerHTML).catch(() => null);
        
        // Image URLs - combining selectors for main gallery and preview images
        const imageUrls = await page.$eval('img.od-gallery-img, img.ant-image-img', images => images.map(img => img.src)).catch(() => []);

        const videoUrls = []; // Still assuming no direct video scraping for now

        console.log('Scraped Data:');
        console.log('Name:', productName);
        console.log('Description:', productDescription);
        console.log('Price:', productPrice);
        console.log('Image URLs:', imageUrls);
        console.log('Video URLs:', videoUrls);

        return {
            original: {
                productName,
                productDescription,
                productPrice,
                imageUrls,
                videoUrls
            },
            translated: { // Placeholder for translated data
                productName: '', 
                productDescription: ''
            },
            message: 'Scraped data from ' + url
        };

    } catch (error) {
        console.error('Scraping failed:', error);
        return null;
    } finally {
        await browser.close();
    }
}

const exampleUrl = 'https://detail.1688.com/offer/961120439255.html?offerId=961120439255&spm=a260k.home2025.recommendpart.1';
scrapeProduct(exampleUrl)
    .then(data => {
        if (data) {
            console.log('Scraping successful:', data);
        } else {
            console.log('Scraping failed.');
        }
    })
    .catch(console.error);
