// eslint-disable-next-line no-unused-vars
import { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { Canvas } from "@react-three/fiber";
// eslint-disable-next-line no-unused-vars
import { XR, ARButton, Controllers, Hands, useHitTest, useXR } from "@react-three/xr";
// eslint-disable-next-line no-unused-vars
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { api } from "../lib/api";
import { toastSuccess } from "../lib/toast";
// eslint-disable-next-line no-unused-vars
import { ArrowLeft, ShoppingCart, ZoomIn, ZoomOut, Move, X } from "lucide-react";

// eslint-disable-next-line no-unused-vars
const ARArtwork = ({ imageUrl, onClose, onAddToCart, onBuyNow, onBack }) => {
  const [texture, setTexture] = useState(null);
  const [placed, setPlaced] = useState(false);
  const [position, setPosition] = useState([0, 0, -1]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [geometry, setGeometry] = useState([1.5, 1.5]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        setTexture(loadedTexture);
        // Calculate aspect ratio and set geometry
        const aspectRatio = loadedTexture.image.width / loadedTexture.image.height;
        const width = 1.5;
        const height = width / aspectRatio;
        setGeometry([width, height]);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        loader.load(
          'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg',
          (fallbackTexture) => {
            setTexture(fallbackTexture);
            setGeometry([1.5, 1.5]); // Default fallback
          }
        );
      }
    );
  }, [imageUrl]);

  useHitTest((hitMatrix, hit) => {
    if (hit && !placed) {
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      hitMatrix.decompose(position, rotation, scale);

      // Position the artwork slightly in front of the hit surface
      position.add(new THREE.Vector3(0, 0, 0.1));

      setPosition([position.x, position.y, position.z]);
      setRotation([rotation.x, rotation.y, rotation.z, rotation.w]);
    }
  });

  const handleTap = () => {
    if (!placed) {
      setPlaced(true);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleMoveUp = () => {
    setPosition(([x, y, z]) => [x, y + 0.05, z]);
  };

  const handleMoveDown = () => {
    setPosition(([x, y, z]) => [x, y - 0.05, z]);
  };

  const handleMoveLeft = () => {
    setPosition(([x, y, z]) => [x - 0.05, y, z]);
  };

  const handleMoveRight = () => {
    setPosition(([x, y, z]) => [x + 0.05, y, z]);
  };

  if (!texture) {
    return (
      <Html position={[0, 0, -2]} center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading artwork...</p>
        </div>
      </Html>
    );
  }

  return (
    <>
      {/* AR Plane with artwork image */}
      {placed && (
        <mesh
          position={position}
          rotation={rotation}
          scale={[scale, scale, scale]}
          onClick={handleTap}
        >
          <planeGeometry args={geometry} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      )}

      {/* Placement Indicator */}
      {!placed && (
        <mesh position={position} onClick={handleTap}>
          <ringGeometry args={[0.1, 0.15, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
      )}

      {/* UI - Only show after placement */}
      {placed && (
        <Html center position={[0, 1, -2]}>
          <div className="flex flex-col gap-3 min-w-[200px]">
            {/* Scale Controls */}
            <div className="bg-black/70 p-3 rounded-lg">
              <p className="text-white text-xs text-center mb-2">Resize</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleZoomOut}
                  className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-white flex items-center px-2">{Math.round(scale * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>

            {/* Position Controls */}
            <div className="bg-black/70 p-3 rounded-lg">
              <p className="text-white text-xs text-center mb-2">Move Position</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleMoveUp}
                    className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                    title="Move Up"
                  >
                    <Move size={20} className="rotate-180" />
                  </button>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={handleMoveLeft}
                    className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                    title="Move Left"
                  >
                    <Move size={20} className="-rotate-90" />
                  </button>
                  <button
                    onClick={handleMoveDown}
                    className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                    title="Move Down"
                  >
                    <Move size={20} />
                  </button>
                  <button
                    onClick={handleMoveRight}
                    className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"
                    title="Move Right"
                  >
                    <Move size={20} className="rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reposition Button */}
            <button
              onClick={() => setPlaced(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Move size={18} />
              Reposition
            </button>

            {/* Decision Buttons */}
            <button
              onClick={onBuyNow}
              className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
            >
              <ShoppingCart size={18} />
              Buy Now
            </button>

            <button
              onClick={onAddToCart}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              Add to Cart
            </button>

            <button
              onClick={onBack}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <button
              onClick={onClose}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <X size={18} />
              Close AR
            </button>
          </div>
        </Html>
      )}

      {/* Instructions before placement — camera is on, user sees the wall */}
      {!placed && (
        <Html center position={[0, 1.5, -2]}>
          <div className="bg-black/70 text-white px-6 py-4 rounded-lg text-center max-w-[280px]">
            <p className="text-lg font-semibold mb-2">Point at the wall</p>
            <p className="text-sm opacity-90">Tap the screen to place the painting and see how it looks on the wall</p>
          </div>
        </Html>
      )}
    </>
  );
};

const ARView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const arButtonRef = useRef();

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [startAR, setStartAR] = useState(false);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const data = await api.getArtwork(id);
        setArtwork(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  // Do not auto-click ARButton — browser requires a direct user gesture to allow camera/XR access.
  // User must click "Start AR" themselves after "View in AR".

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cartItems") || "{}");
    cart[artwork._id] = (cart[artwork._id] || 0) + 1;
    localStorage.setItem("cartItems", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    toastSuccess(`Added "${artwork.title}" to cart!`);
  };

  const handleBuyNow = () => {
    const cart = JSON.parse(localStorage.getItem("cartItems") || "{}");
    cart[artwork._id] = (cart[artwork._id] || 0) + 1;
    localStorage.setItem("cartItems", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    toastSuccess(`Added "${artwork.title}" to cart!`);
    navigate("/cart");
  };

  const handleBack = () => {
    navigate(`/artwork-details/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading AR...</p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load artwork</p>
      </div>
    );
  }

  if (startAR) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Step 1: Ask user to start camera — must be a real click for browser to allow camera access */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
          <div className="bg-gray-900/90 text-white rounded-xl p-6 max-w-md mb-6">
            <h2 className="text-xl font-semibold mb-4">View painting on your wall</h2>
            <ol className="text-left space-y-3 text-sm mb-6">
              <li><strong>1.</strong> Click <span className="text-purple-300">&quot;Start AR&quot;</span> below — your camera will turn on so you can see the wall.</li>
              <li><strong>2.</strong> Point your phone at the wall where you want to see the painting.</li>
              <li><strong>3.</strong> Tap the screen to place the artwork, then see how it looks on the wall.</li>
            </ol>
            <ARButton
              ref={arButtonRef}
              sessionInit={{
                mode: 'immersive-ar',
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Start AR (open camera)
            </ARButton>
          </div>
          <button
            onClick={() => setStartAR(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>

        <Canvas>
          <XR
            sessionInit={{
              mode: 'immersive-ar',
              requiredFeatures: ['hit-test'],
              optionalFeatures: ['dom-overlay'],
            }}
          >
            <Controllers />
            <Hands />
            <Suspense fallback={null}>
              <ARArtwork
                imageUrl={artwork.image_url}
                onClose={() => setStartAR(false)}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onBack={handleBack}
              />
            </Suspense>
          </XR>
        </Canvas>

        {/* Close button when in AR session — shown by AR content */}
        <button
          onClick={() => setStartAR(false)}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-red-600/90 text-white rounded-lg hover:bg-red-700"
          aria-label="Close AR"
        >
          Close AR
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <img
        src={artwork.image_url}
        alt={artwork.title}
        className="max-w-md rounded shadow-lg mb-6"
      />

      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-6 py-3 rounded"
        >
          Back
        </button>

        <button
          onClick={() => setStartAR(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded"
        >
          View in AR
        </button>

        <button
          onClick={handleAddToCart}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ARView;
