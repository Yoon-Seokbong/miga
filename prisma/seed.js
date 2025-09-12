"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminEmail, adminPassword, hashedPassword, adminUser, categoriesData, _i, categoriesData_1, categoryData, electronics, clothing, books, productsData, _a, productsData_1, productData, images, videos, rest;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Start seeding...');
                    adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
                    adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
                    return [4 /*yield*/, bcryptjs_1.default.hash(adminPassword, 10)];
                case 1:
                    hashedPassword = _b.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: adminEmail },
                            update: { password: hashedPassword, role: 'ADMIN' },
                            create: {
                                email: adminEmail,
                                name: 'Admin User',
                                password: hashedPassword,
                                role: 'ADMIN',
                            },
                        })];
                case 2:
                    adminUser = _b.sent();
                    console.log("Created/updated admin user with email: ".concat(adminUser.email));
                    categoriesData = [
                        { name: '전자제품' },
                        { name: '의류' },
                        { name: '도서' },
                        { name: '식품' },
                        { name: '가구' },
                    ];
                    _i = 0, categoriesData_1 = categoriesData;
                    _b.label = 3;
                case 3:
                    if (!(_i < categoriesData_1.length)) return [3 /*break*/, 6];
                    categoryData = categoriesData_1[_i];
                    return [4 /*yield*/, prisma.category.upsert({
                            where: { name: categoryData.name },
                            update: {},
                            create: categoryData,
                        })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('Seeded categories.');
                    return [4 /*yield*/, prisma.category.findUnique({ where: { name: '전자제품' } })];
                case 7:
                    electronics = _b.sent();
                    return [4 /*yield*/, prisma.category.findUnique({ where: { name: '의류' } })];
                case 8:
                    clothing = _b.sent();
                    return [4 /*yield*/, prisma.category.findUnique({ where: { name: '도서' } })];
                case 9:
                    books = _b.sent();
                    productsData = [
                        {
                            name: '스마트폰',
                            description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '최신 스마트폰입니다.' } }] }),
                            price: 1200.00,
                            stock: 100,
                            brand: 'ABC',
                            tags: '스마트폰, 휴대폰, 전자',
                            categoryId: electronics === null || electronics === void 0 ? void 0 : electronics.id,
                            images: [{ url: 'https://via.placeholder.com/300x300?text=Smartphone' }],
                            videos: [{ url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }], // Placeholder video
                        },
                        {
                            name: '노트북',
                            description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '고성능 노트북입니다.' } }] }),
                            price: 1500.00,
                            stock: 50,
                            brand: 'XYZ',
                            tags: '노트북, 컴퓨터, 전자',
                            categoryId: electronics === null || electronics === void 0 ? void 0 : electronics.id,
                            images: [{ url: 'https://via.placeholder.com/300x300?text=Laptop' }],
                        },
                        {
                            name: '티셔츠',
                            description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '편안한 면 티셔츠입니다.' } }] }),
                            price: 25.00,
                            stock: 200,
                            brand: 'FashionCo',
                            tags: '티셔츠, 의류, 면',
                            categoryId: clothing === null || clothing === void 0 ? void 0 : clothing.id,
                            images: [{ url: 'https://via.placeholder.com/300x300?text=T-Shirt' }],
                        },
                        {
                            name: '소설책',
                            description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '베스트셀러 소설입니다.' } }] }),
                            price: 15.00,
                            stock: 300,
                            brand: 'Bookworm',
                            tags: '소설, 책, 문학',
                            categoryId: books === null || books === void 0 ? void 0 : books.id,
                            images: [{ url: 'https://via.placeholder.com/300x300?text=Book' }],
                        },
                    ];
                    _a = 0, productsData_1 = productsData;
                    _b.label = 10;
                case 10:
                    if (!(_a < productsData_1.length)) return [3 /*break*/, 13];
                    productData = productsData_1[_a];
                    images = productData.images, videos = productData.videos, rest = __rest(productData, ["images", "videos"]);
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { name: rest.name },
                            update: __assign(__assign({}, rest), { images: {
                                    create: images ? images.map(function (img) { return ({ url: img.url }); }) : [],
                                }, videos: {
                                    create: videos ? videos.map(function (vid) { return ({ url: vid.url }); }) : [],
                                } }),
                            create: __assign(__assign({}, rest), { images: {
                                    create: images ? images.map(function (img) { return ({ url: img.url }); }) : [],
                                }, videos: {
                                    create: videos ? videos.map(function (vid) { return ({ url: vid.url }); }) : [],
                                } }),
                        })];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log('Seeded products.');
                    console.log('Seeding finished.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
