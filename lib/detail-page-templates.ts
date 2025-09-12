export const basicDetailPageTemplate = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PRODUCT_NAME}} 상세 페이지</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; color: #333; }
        .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 20px; }
        .price { font-size: 2em; font-weight: bold; color: #e60023; text-align: center; margin-bottom: 20px; }
        .product-image { max-width: 100%; height: auto; display: block; margin: 0 auto 20px auto; border-radius: 4px; }
        .description { line-height: 1.6; margin-bottom: 20px; }
        .section-title { font-size: 1.5em; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .gallery-image { max-width: 100%; height: auto; display: block; margin-bottom: 10px; border-radius: 4px; }
        .video-player { max-width: 100%; height: auto; display: block; margin-bottom: 10px; border-radius: 4px; }
        .attributes table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .attributes th, .attributes td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .attributes th { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{PRODUCT_NAME}}</h1>
        <p class="price">{{PRODUCT_PRICE}}원</p>
        
        {{MAIN_IMAGE}}

        <div class="description">
            <p>{{PRODUCT_DESCRIPTION}}</p>
        </div>

        {{GALLERY_IMAGES}}

        {{VIDEOS}}

        {{ATTRIBUTES}}

        <div class="section-title">구매 전 확인사항</div>
        <p>본 상품은 해외 구매대행 상품입니다. 주문 후 배송까지 7~14일 소요될 수 있습니다.</p>
        <p>관세 및 부가세는 구매자 부담입니다.</p>
    </div>
</body>
</html>
`;