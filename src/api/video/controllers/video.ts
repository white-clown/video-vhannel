/**
 * video controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::video.video',({strapi})=>({
    //delete video
    async delete(ctx) {
        try{
            const { id } = ctx.params;
            const video=await strapi.documents('api::video.video').findOne(id)
            if(!video){
                return ctx.badRequest('Video not exist')
            }
            await strapi.documents('api::video.video').delete(id);
            return { message: 'Video deleted successfully' };
        }catch(error){
            strapi.log.error('Delete Failed:', error);
            return ctx.internalServerError('Delete Failed');
        }
    },
    //create video
    async create(ctx){
        try{
            const {title,description,url,cover_photo,channel,tags}=ctx.request.body.data;
            const user= ctx.state.user;
    
            if (!user) {
                return ctx.unauthorized('User not registered');
            }
            if(!title) return ctx.badRequest('Title cannot be blank');
            if(!description) return ctx.badRequest('Description cannot be blank');
            if(!url) return ctx.badRequest('Video url cannot be blank');
            if(!cover_photo) return ctx.badRequest('Cover Photo url cannot be blank');
            if(!channel) return ctx.badRequest('Please select a Channel');
            if(!tags) return ctx.badRequest('Please select aleast one tag');
            
            const video = await strapi.documents('api::video.video').create({
                data:{
                    title,
                    description,
                    url,
                    cover_photo,
                    channel,
                    uploader:user.id,
                    tags
                }
            })
            return ctx.send(video)
        }catch(error){
            strapi.log.error('Video Create Failed:', error);
            return ctx.internalServerError('Video Create Failed');
        }
    },
    //comment video
    async comment(ctx){
        try {
        const {id} = ctx.params;
        const { content , parent_id } = ctx.request.body.data;
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('User not registered');
        }

        if (!content) {
            return ctx.badRequest('Content cannot be blank');
        }

        const video = await strapi.documents('api::video.video').findOne({documentId:id,populate:"comments"});
        if (!video) {
        return ctx.notFound('Video not found');
        }

        //parent_id the comment id that is going to be comment by another comment
        const parentComment = await strapi.documents('api::comment.comment').findOne(id);
        if(!parentComment)return ctx.badRequest('Parent comment does not exit');

        const commentData = {
            content,
            video: id, 
            user: user.id,  
            parent_id:null
        };

        //if Parent comment exit add the parent_id
        if(parent_id){
            commentData.parent_id = parent_id;
        }

        await strapi.documents('api::comment.comment').create({
            data: commentData
        })
        }catch(error){
            strapi.log.error('Comment Failed:', error);
            return ctx.internalServerError('Comment Failed');
        }
    },
}));
