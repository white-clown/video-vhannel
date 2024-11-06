export default{
    async beforeDelete(event){
        const {where}=  event.params;
        const videoId= where.documentId;

        await strapi.documents('api::comment.comment').delete({
            documentId:videoId
        })
        console.log('comment deleted')
    }
}