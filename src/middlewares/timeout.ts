// /**
//  * `timeout` middleware
//  */

// import type { Core } from '@strapi/strapi';

// export default (config, { strapi }: { strapi: Core.Strapi }) => {
//   // Add your own logic here.
//   return async (ctx, next) => {
//     strapi.log.info('In timeout middleware.');

//     const timeout = 1000;
//     const controller = new AbortController();
//     const { signal } = controller;

//     // 定义超时 Promise，使用 AbortController 取消请求
//     const timer = new Promise((_, reject) =>
//       setTimeout(() => {
//         controller.abort(); // 取消请求
//         ctx.status = 503;
//         ctx.body = { error: 'Request timeout. Please try again later.' };
//         reject(new Error('Request timed out'));
//       }, timeout)
//     );

//     // 使用 Promise.race 确保超时中断
//     try {
//       await Promise.race([next().then(() => signal.aborted ), timer]);
//     } catch (error) {
//       if (error.message === 'Request timed out') {
//         ctx.throw(503, 'Request timeout. Please try again later.');
//       } else {
//         throw error;
//       }
//     }
//   };
// };
