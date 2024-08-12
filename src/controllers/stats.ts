import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../model/coupon.js";
import { Order } from "../model/order.js";
import { Product } from "../model/product.js";
import { User } from "../model/user.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
    let stats;
    if (myCache.has("admin-stats")) stats = JSON.parse((myCache.get("admin-stats") as string));
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);



        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: today
        }

        const lastMonth = {
            start: new Date(today.getFullYear() - 1, today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0)
        }
        const thisMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })
        const lastMonthProductsPromise = await Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })
        const thisMonthUsersPromise = await User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })
        const lastMonthUsersPromise = await User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })
        const thisMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            }
        })
        const lastMonthOrdersPromise = await Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            }
        })

        const lastSixOrdersPromise = await Order.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            }
        })

        const latestTransactionsPromise = Order.find({}).select(["orderItems", "discount", "total", "status"]).limit(4);

        const [thisMonthProducts, thisMonthUsers, thisMonthOrders, lastMonthProducts, lastMonthUsers,
            lastMonthOrders, productsCount, usersCount, allOrders, lastSixOrders, categories, femaleCount,
            latestTransactions] = await Promise.all([
                thisMonthProductsPromise, thisMonthUsersPromise, thisMonthOrdersPromise,
                lastMonthProductsPromise, lastMonthUsersPromise, lastMonthOrdersPromise,
                Product.countDocuments(), User.countDocuments(), Order.find({}).select("total"),
                lastSixOrdersPromise, Product.distinct("category"), User.countDocuments({ gender: "female" }),
                latestTransactionsPromise,

            ])

        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);


        const revenueChangePercent = calculatePercentage(thisMonthRevenue, lastMonthRevenue);
        const userChangePercent = calculatePercentage(thisMonthUsers.length, lastMonthUsers.length);
        const productChangePercent = calculatePercentage(thisMonthProducts.length, lastMonthProducts.length);
        const orderChangePercent = calculatePercentage(thisMonthOrders.length, lastMonthOrders.length);

        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = { revenue: revenue, product: productsCount, user: usersCount, order: allOrders.length };
        const changePercent = { revenue: revenueChangePercent, product: productChangePercent, user: userChangePercent, order: orderChangePercent }

        const orderMonthCounts = new Array(6).fill(0);
        const orderMonthlyRevenue = new Array(6).fill(0);



        lastSixOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthdiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

            if (monthdiff < 6) {
                orderMonthCounts[6 - monthdiff - 1] += 1;
                orderMonthlyRevenue[6 - monthdiff - 1] += order.total;
            }
        })


        const categoryCount: Record<string, number>[] = await getInventories({ categories, productsCount });


        const userRatio = {
            male: usersCount - femaleCount,
            female: femaleCount,
        }

        const modifiedLatestTransaction = latestTransactions.map((i) => ({
            _id: i._id,
            discount: i.discount,
            amount: i.total,
            quantity: i.orderItems.length,
            status: i.status,
        }))
        stats = {
            categoryCount,
            changePercent, count, chart: {
                order: orderMonthCounts,
                revenue: orderMonthlyRevenue,},
                userRatio,
                latestTransactions:modifiedLatestTransaction
        };
        myCache.set("admin-stats", JSON.stringify(stats));


    }
    return res.status(200).json({
        success: true,
        stats,

    })



});



export const getPieCharts = TryCatch(async (req, res, next) => {

    let charts;

    if (myCache.has("admin-pie-charts")) charts = JSON.parse(myCache.get("admin-pie-charts") as string);
    else {

        const allOrderPromise = Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"])
        const [processingOrder, shippedOrder, deliveredOrder, categories, productsCount, productsOutOfStock, allOrders,
            allUsers, adminUsers, customerUsers
        ] = await Promise.all([
            Order.countDocuments({ status: "Processing" }),
            Order.countDocuments({ status: "Shipped" }),
            Order.countDocuments({ status: "Delivered" }),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({ stock: 0 }),
            allOrderPromise,
            User.find({}).select(["dob"]),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "user" }),


        ]);


        const orderFullfillment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        }
        const productsCategories: Record<string, number>[] = await getInventories({ categories, productsCount });
        const stockAvailablity = { inStock: productsCount - productsOutOfStock, outOfStock: productsOutOfStock }

        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;

        const revenueDistribution = {
            netMargin: netMargin,
            discount: discount,
            productionCost: productionCost,
            burnt: burnt,
            marketingCost: marketingCost,


        }

        const usersAgeGroup = {
            teen: allUsers.filter(i => i.age < 20).length,
            adult: allUsers.filter(i => i.age > 20 && i.age < 40).length,
            old: allUsers.filter(i => i.age > 40).length
        };

        const adminCustomers = {
            admin: adminUsers,
            customer: customerUsers,
        }

        charts = {
            orderFullfillment,
            productsCategories,
            stockAvailablity,
            revenueDistribution,
            usersAgeGroup,
            adminCustomers,
        }


        myCache.set("admin-pie-charts", JSON.stringify(charts));
    }





    return res.status(200).json({
        success: true,
        charts,

    })

})
export const getBarCharts = TryCatch(async (req, res, next) => {
    let charts;
    const key = "admin-bar-charts";
   if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
    else {
        const today = new Date();
        const sixMonthAgo = new Date();
        sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
       const sixMonthProductsPromise = Product.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            }
        }).select("createdAt")

        const twelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            }
        }).select("createdAt")
        const sixMonthUsersPromise = User.find({
            createdAt: {
                $gte: sixMonthAgo,
                $lte: today,
            }
        }).select("createdAt")



        const [products, users, orders] = await Promise.all([
            sixMonthProductsPromise, sixMonthUsersPromise, twelveMonthOrdersPromise

        ])

        const productCounts = getChartData({length:6,today,docArr:products});
        const userCounts = getChartData({length:6,today,docArr:users});
        const orderCounts = getChartData({length:12,today,docArr:orders});


        charts = {
            users:userCounts,
            products:productCounts,
            orders:orderCounts,
        }

        myCache.set(key, JSON.stringify(charts));
    }



    return res.status(200).json({
        success: true,
        charts,

    })
})
export const getLineCharts = TryCatch(async (req,res,next) => {  let charts;
    const key = "admin-line-charts";
   if (myCache.has(key)) charts = JSON.parse(myCache.get(key) as string);
    else {
        const today = new Date();
        
        const twelveMonthAgo = new Date();
        twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
       

        const twelveMonthProductsPromise = Product.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            }
        }).select(["createdAt","discount","total"])
        const twelveMonthOrdersPromise = Order.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            }
        }).select(["createdAt","discount","total"])
        const twelveMonthUsersPromise = User.find({
            createdAt: {
                $gte: twelveMonthAgo,
                $lte: today,
            },
            
        }).select(["createdAt","discount","total"])
         



        const [products, users, orders] = await Promise.all([
            twelveMonthProductsPromise, twelveMonthUsersPromise, twelveMonthOrdersPromise

        ])

        const productCounts = getChartData({length:12,today,docArr:products});
        const userCounts = getChartData({length:12,today,docArr:users});
        const discount = getChartData({length:12,today,docArr:orders,property:"discount"});
        const revenue = getChartData({length:12,today,docArr:orders,property:"total"});


        charts = {
            users:userCounts,
            products:productCounts,
            discount,
            revenue,
            
        }

        myCache.set(key, JSON.stringify(charts));
    }



    return res.status(200).json({
        success: true,
        charts,

    })
 })