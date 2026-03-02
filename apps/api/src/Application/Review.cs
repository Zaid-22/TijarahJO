using TijarahJo.Domain.Models;

namespace TijarahJoDB.BLL
{
    public class Review
    {
        public ReviewModel ReviewModel { get; set; }

        public Review()
        {
            this.ReviewModel = new ReviewModel();
        }

        public Review(ReviewModel reviewModel)
        {
            this.ReviewModel = reviewModel;
        }
    }
}
