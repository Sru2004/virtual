import img1 from "../assets/img1.png";
import img2 from "../assets/img2.png";
import img3 from "../assets/img3.png";

export default function LatestCreations() {
    return (
        <>
            {/* Poppins Font */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800;900&display=swap');

                * {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-gray-800 mb-2">
                    Featured Artworks
                </h1>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">
                    Discover the latest masterpieces from our talented artists. Each piece tells a unique story and brings art to life.
                </p>
            </div>

            <div className="flex items-center justify-center gap-6 h-[400px] w-full max-w-5xl mx-auto mb-12">

                {/* Card 1 */}
                <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
                    <img
                        className="h-full w-full object-cover"
                        src={img1}
                        alt="artwork 1"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50
                                    opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <h1 className="text-3xl">Title One</h1>
                        <p className="text-sm">A captivating abstract piece that explores the depths of human emotion through vibrant colors and dynamic brushstrokes. This artwork captures the essence of inner turmoil and eventual peace.</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
                    <img
                        className="h-full w-full object-cover"
                        src={img2}
                        alt="artwork 2"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50
                                    opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <h1 className="text-3xl">Title Two</h1>
                        <p className="text-sm">A serene landscape painting that captures the tranquility of nature at dawn. Soft pastel colors blend seamlessly to create a sense of calm and renewal.</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
                    <img
                        className="h-full w-full object-cover"
                        src={img3}
                        alt="artwork 3"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50
                                    opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <h1 className="text-3xl">Title Three</h1>
                        <p className="text-sm">A bold contemporary sculpture that challenges traditional forms. Using industrial materials, this piece represents the intersection of technology and human creativity.</p>
                    </div>
                </div>

            </div>
        </>
    );
}
