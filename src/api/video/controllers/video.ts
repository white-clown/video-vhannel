/**
 * video controller
 */

import { factories } from '@strapi/strapi'
import { devNull } from 'os';
import { isNullOrUndefined } from 'util';

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
    //like a video
    async like(ctx){
        try{
            const {id}= ctx.params;
            const user= ctx.state.user;
            if(!user){
                ctx.unauthorized('User not Authorized');
            }
            const video =await strapi.documents('api::video.video').findOne({
                documentId:id
            });
            if(video){
                // console.log(video)
                const likes = Array.isArray(video.likes) ? video.likes : [];
                if (likes.includes(user.id)) {
                    // return ctx.badRequest('You have already liked this video.');
                    const removedLike = likes.filter(id => id !== user.id);
                    await strapi.documents('api::video.video').update({
                        documentId:id,
                        data:{likes:removedLike}
                    });
                    return {message:'Like remove'}
                }
                const  liked=Number(video.likes)+1
                await strapi.documents('api::video.video').update({
                    documentId:id,
                    data: { likes:[...likes,user.id]}
                });
                return {message:'Liked'};
            }else{
                return ctx.badRequest('Video not found');
            }
        }catch(error){
            strapi.log.error('Like Failed:', error);
            return ctx.internalServerError('Like Failed');
        }

    },
    //Dislike
    async dislike(ctx){
        try{
            const {id}= ctx.params;
            const user= ctx.state.user;
            if(!user){
                ctx.unauthorized('User not Authorized');
            }
            const video =await strapi.documents('api::video.video').findOne({
                documentId:id
            });
            if(video){
                // console.log(video)
                const dislikes = Array.isArray(video.dislikes) ? video.dislikes : [];
                if (dislikes.includes(user.id)) {
                    // return ctx.badRequest('You have already disliked this video.');
                    const removedDislike = dislikes.filter(id => id !== user.id);
                    await strapi.documents('api::video.video').update({
                        documentId:id,
                        data:{dislikes:removedDislike}
                    });
                    return {message:'Dislike remove'}
                }
                const  liked=Number(video.dislikes)+1
                strapi.documents('api::video.video').update({
                    documentId:id,
                    data: { dislikes:[...dislikes,user.id]}
                });
                return {message:'Disliked'};
            }else{
                return ctx.badRequest('Video not found');
            }
        }catch(error){
            strapi.log.error('Dislikes Failed:', error);
            return ctx.internalServerError('Dislikes Failed');
        }

    },
    //add to playlist
    async addToPlaylist(ctx){
        try{
            const {id}=ctx.params;
            const {playlistId}=ctx.request.body.data;
            const user =ctx.state.user;
            if(!user){
                return ctx.unauthorized('User no Authorized');
            }
            const video= await strapi.documents('api::video.video').findOne({documentId:id});
            if(!video)return ctx.notFound('Video not Found.');
            const playlist= await strapi.documents('api::playlist.playlist').findOne({
                documentId: playlistId,
                populate:['videos','user']
            });
            // console.log(playlist.user.id);

            if(playlist.user.id!==user.id)return ctx.badRequest('Not Your Playlist');
            // console.log(user.id);
            // // console.log(video);
            // console.log(playlist);
            if(!playlist)return ctx.notFound('Playlist not Found');

            const alreadyAdded=playlist.videos.some(videos=>videos.id===video.id)
            if(alreadyAdded)return ctx.badRequest('Already Added to Playlist');
            // const updatedPlaylist=[...playlist.videos.map(v=>v.id),video.id]
            
            // console.log([...playlist.videos.map(v=>v.documentId),video.documentId])
            const playlistUpdated=await strapi.documents('api::playlist.playlist').update({
                documentId:playlistId,
                data:{videos:[...playlist.videos.map(v=>v.documentId),video.documentId]},
                populate:['videos']
            });
            console.log(playlistUpdated);
            if(playlistUpdated)return {message:"Added to the playlist"}
        }catch(error){
            strapi.log.error('Add to Playlist Failed:',error);
            return ctx.internalServerError('Add to Playlist Failed');
        }
    },
    //remove from playlist
    async removeFromPlaylist(ctx){
        try{
            const {id}=ctx.params;
            const {playlistId}=ctx.request.body.data;
            const user =ctx.state.user;
            if(!user){
                return ctx.unauthorized('User no Authorized');
            }
            const video= await strapi.documents('api::video.video').findOne({documentId:id});
            if(!video)return ctx.notFound('Video not Found.');
            const playlist= await strapi.documents('api::playlist.playlist').findOne({
                documentId: playlistId,
                populate:['videos','user']
            });

            if(!playlist)return ctx.notFound('Playlist not Found');

            if(playlist.user.id!==user.id)return ctx.badRequest('Not Your Playlist');

            const alreadyAdded=playlist.videos.some(videos=>videos.id===video.id)
            if(!alreadyAdded){
                return ctx.badRequest('Video not found in the playlist');
            }

            const updated = playlist.videos.filter(videos => videos.documentId !== video.documentId).map(v => v.documentId);
            
            const playlistUpdated=await strapi.documents('api::playlist.playlist').update({
                documentId:playlistId,
                data:{videos:updated},
                populate:['videos']
            });
            console.log(playlistUpdated);
            if(playlistUpdated)return {message:"Remove from the playlist"}
        }catch(error){
            strapi.log.error('Remove from Playlist Failed:',error);
            return ctx.internalServerError('Remove from Playlist Failed');
        }
    }
}));
