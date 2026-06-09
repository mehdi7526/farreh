import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Gem,
  Home,
  Instagram,
  LockKeyhole,
  MapPin,
  Phone,
  LogOut,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  gramBuyPriceRial,
  gramSellPriceRial,
  products,
  type Product,
  type ProductCategory,
} from "./data/products";
import { formatNumber, formatRial, todayFa } from "./utils/format";
import {
  PriceApiError,
  applyPriceStateToProducts,
  clearAuthToken,
  fetchPriceState,
  getDefaultPriceState,
  loginAdmin,
  readAuthToken,
  savePriceState,
  type SavedPriceState,
  writeAuthToken,
} from "./utils/priceStorage";

const categories: Array<ProductCategory | "همه محصولات"> = [
  "همه محصولات",
  "ساچمه نقره",
  "شمش نقره",
];

const heroStats = [
  { icon: ShieldCheck, label: "عیار", value: "۹۹۹" },
  { icon: Scale, label: "وزن‌ها", value: "۲۵ تا ۱۰۰۰ گرم" },
  { icon: Store, label: "مراجعه", value: "تهران، قیطریه" },
];

const defaultPriceState = getDefaultPriceState(
  products,
  gramBuyPriceRial,
  gramSellPriceRial
);

const PRODUCT_IMAGE_FALLBACK = "/images/products/farreh-shot-50g.jpeg";

const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const parsePriceInput = (value: string) => {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const formatPriceInput = (value: number) =>
  Number.isFinite(value) ? formatNumber(value) : "";

const formatSavedTime = (value: Date | string = new Date()) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(safeDate);
};

const useFallbackImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.src.endsWith(PRODUCT_IMAGE_FALLBACK)) return;

  event.currentTarget.src = PRODUCT_IMAGE_FALLBACK;
};

function useSavedPriceState() {
  const [priceState, setPriceState] = useState(defaultPriceState);

  useEffect(() => {
    let isMounted = true;

    const syncPriceState = async () => {
      try {
        const response = await fetchPriceState(defaultPriceState);
        if (isMounted) setPriceState(response.prices);
      } catch {
        if (isMounted) setPriceState(defaultPriceState);
      }
    };

    void syncPriceState();
    return () => {
      isMounted = false;
    };
  }, []);

  return priceState;
}

function SilverParticles({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const count = 112;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = i * 0.71;
      const radius = 1.2 + ((i % 24) / 24) * 2.7;
      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = Math.sin(angle * 0.58) * 1.8 + ((i % 9) - 4) * 0.09;
      array[i * 3 + 2] = Math.sin(angle) * radius - 1.1;
    }

    return array;
  }, []);

  useFrame((state, delta) => {
    if (paused || !groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.035;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#f7fbff"
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.78}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function FloatingSilver({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (paused || !groupRef.current) return;

    groupRef.current.rotation.y -= delta * 0.08;
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.55) * 0.08;
  });

  const beads = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => ({
        position: [
          Math.cos(index * 0.82) * (1.2 + (index % 4) * 0.24),
          Math.sin(index * 0.61) * 0.82 - 0.1,
          -0.4 - (index % 5) * 0.22,
        ] as [number, number, number],
        scale: 0.055 + (index % 3) * 0.014,
      })),
    []
  );

  return (
    <group ref={groupRef} position={[0.1, -0.1, 0]}>
      {beads.map((bead, index) => (
        <mesh key={index} position={bead.position} scale={bead.scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color="#f5f8fb"
            emissive="#aeb9bf"
            emissiveIntensity={0.25}
            metalness={0.72}
            roughness={0.2}
            envMapIntensity={1.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function HeroScene() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-80"
      aria-hidden="true"
    >
      <Canvas
        dpr={1}
        camera={{ position: [0, 0, 4.7], fov: 54 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[2.5, 3, 2]}
          intensity={2.3}
          color="#ffffff"
        />
        <pointLight position={[-2, 1.5, 2]} intensity={1.6} color="#8ddad4" />
        <SilverParticles paused={reducedMotion} />
        <FloatingSilver paused={reducedMotion} />
      </Canvas>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="logo-mark">
      <img src="/images/brand/farreh-logo.png" alt="لوگوی گالری فرّه" />
    </span>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-farreh-ink/62 backdrop-blur-2xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3 text-white">
          <LogoMark />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold sm:text-base">گالری فرّه</span>
            <span className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-farreh-silver/70">
              FARREH
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-6 text-sm text-farreh-silver/78 md:flex">
          <a className="nav-link" href="#prices">
            قیمت روز
          </a>
          <a className="nav-link" href="#products">
            محصولات
          </a>
          <a className="nav-link" href="#contact">
            تماس
          </a>
        </div>

        <a
          className="icon-button"
          href="tel:02122696502"
          aria-label="تماس با گالری فرّه"
        >
          <Phone size={18} />
        </a>
      </nav>
    </header>
  );
}

function Hero({ priceState }: { priceState: SavedPriceState }) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <section
      id="top"
      className="hero-shell relative isolate min-h-[88svh] overflow-hidden pt-16 text-white"
    >
      <HeroScene />
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/products/farreh-shot-collection.jpeg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,5,12,0.98),rgba(18,7,24,0.74)_48%,rgba(8,5,12,0.46))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,16,0.18),rgba(10,8,16,0.72)_78%,#0a0810)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(88svh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 border-r-2 border-farreh-aqua pr-3 text-sm font-bold text-farreh-aqua">
            <Sparkles size={16} />
            نقره ۹۹۹ با بسته‌بندی اختصاصی
          </p>
          <h1 className="hero-title text-balance text-4xl font-black leading-[1.12] sm:text-5xl lg:text-[3.25rem]">
            گالری فرّه
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.44em] text-farreh-champagne sm:text-base">
            FARREH GALLERY
          </p>
          <p className="mt-7 max-w-2xl text-base leading-8 text-farreh-silver/86 sm:text-lg">
            نمایش ساچمه نقره و شمش نقره با نرخ خرید و فروش روز، آماده برای
            استعلام تلفنی و خرید حضوری.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <motion.a
              whileHover={reducedMotion ? undefined : { y: -3 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className="primary-cta"
              href="tel:02122696502"
            >
              <Phone size={19} />
              تماس مستقیم
            </motion.a>
            <motion.a
              whileHover={reducedMotion ? undefined : { y: -3 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className="secondary-cta"
              href="#products"
            >
              <Gem size={19} />
              مشاهده محصولات
            </motion.a>
          </div>

          <div className="hero-rate-panel" aria-label="نرخ نمایشی روز">
            <div className="hero-rate-head">
              <span>تابلوی نرخ امروز</span>
              <strong>{todayFa}</strong>
            </div>
            <div className="hero-rate-grid">
              <div>
                <span>خرید هر گرم</span>
                <strong>{formatRial(priceState.gramBuyPriceRial)}</strong>
              </div>
              <div>
                <span>فروش هر گرم</span>
                <strong>{formatRial(priceState.gramSellPriceRial)}</strong>
              </div>
            </div>
          </div>

          <div className="hero-stats" aria-label="ویژگی‌های گالری فرّه">
            {heroStats.map((item) => (
              <div key={item.label} className="hero-stat">
                <item.icon size={17} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={
            reducedMotion ? false : { opacity: 0, scale: 0.94, rotate: -2 }
          }
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.95, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="hero-product-frame justify-self-center lg:justify-self-end"
        >
          <div className="hero-product">
            <img
              src="/images/products/farreh-shot-1000g.jpeg"
              alt="ساچمه نقره ۱۰۰۰ گرمی فرّه"
            />
            <span className="hero-product-badge">ساچمه ۱۰۰۰ گرمی</span>
          </div>
          <div className="hero-product-caption">
            <span>FARREH SILVER SHOT</span>
            <strong>999</strong>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PriceStrip({ priceState }: { priceState: SavedPriceState }) {
  return (
    <section id="prices" className="price-board-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="price-board">
          <div className="price-board-head">
            <div>
              <p className="text-sm font-bold text-farreh-aqua">نرخ امروز</p>
              <h2 className="mt-1 text-xl font-black text-white">{todayFa}</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="price-pill">
              <span>قیمت خرید هر گرم</span>
              <strong>{formatRial(priceState.gramBuyPriceRial)}</strong>
            </div>
            <div className="price-pill price-pill-accent">
              <span>قیمت فروش هر گرم</span>
              <strong>{formatRial(priceState.gramSellPriceRial)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ProductCard = forwardRef<
  HTMLElement,
  { product: Product; index: number }
>(function ProductCard({ product, index }, ref) {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <motion.article
      ref={ref}
      layout
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 18 }}
      transition={{
        duration: 0.48,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reducedMotion ? undefined : { y: -8 }}
      className="product-card"
    >
      <div className="product-image-wrap">
        <img
          src={product.image}
          alt={product.titleFa}
          loading="lazy"
          onError={useFallbackImage}
        />
        <span className="weight-chip">
          {formatNumber(product.weightGrams)} گرم
        </span>
        {product.featured ? <span className="featured-badge">ویژه</span> : null}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-farreh-aqua">
              {product.category}
            </p>
            <h3 className="mt-1 text-lg font-black leading-7 text-white">
              {product.titleFa}
            </h3>
          </div>
          <span className="purity-badge">عیار {product.purity}</span>
        </div>

        <p className="min-h-5 text-xs uppercase tracking-[0.2em] text-farreh-silver/50">
          {product.titleEn}
        </p>

        <div className="mt-5 grid gap-3">
          <div className="price-row">
            <span>وزن</span>
            <strong>{formatNumber(product.weightGrams)} گرم</strong>
          </div>
          <div className="price-row">
            <span>قیمت خرید</span>
            <strong>{formatRial(product.buyPriceRial)}</strong>
          </div>
          <div className="price-row sell">
            <span>قیمت فروش</span>
            <strong>{formatRial(product.sellPriceRial)}</strong>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

function ProductsSection({ pricedProducts }: { pricedProducts: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<
    ProductCategory | "همه محصولات"
  >("همه محصولات");

  const visibleProducts = useMemo(
    () =>
      activeCategory === "همه محصولات"
        ? pricedProducts
        : pricedProducts.filter(
            (product) => product.category === activeCategory
          ),
    [activeCategory, pricedProducts]
  );

  return (
    <section id="products" className="section-shell">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">محصولات فرّه</p>
            <h2 className="section-title">
              ساچمه و شمش نقره
              <span className="block">با قیمت خرید و فروش</span>
            </h2>
          </div>
          <div
            className="segmented-control"
            role="tablist"
            aria-label="دسته بندی محصولات"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? "is-active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </Reveal>

        <motion.div
          layout
          className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function PuritySection() {
  return (
    <section className="purity-showcase relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
        <Reveal className="relative z-10 self-center">
          <p className="section-kicker">عیار ۹۹۹</p>
          <h2 className="section-title max-w-2xl">
            تمرکز روی نقره خالص، وزن‌های روشن و نرخ قابل پیگیری
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-farreh-silver/72">
            محصولات گالری فرّه با تمرکز روی ساچمه نقره و شمش نقره عرضه می‌شوند؛
            قیمت هر محصول از وزن و نرخ روز محاسبه شده و برای استعلام قطعی، تماس
            مستقیم با گالری بهترین مسیر است.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="purity-logo-stage" aria-label="لوگوی گالری فرّه">
            <div className="purity-logo-card">
              <img
                src="/images/brand/farreh-logo.png"
                alt="لوگوی گالری فرّه"
                loading="lazy"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="contact-band">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <Reveal>
          <p className="section-kicker">تماس با گالری فرّه</p>
          <h2 className="section-title">برای استعلام قیمت قطعی تماس بگیرید</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-farreh-silver/72">
            با توجه به لحظه ای بودن تغییرات قیمت، نرخ نهایی خرید و فروش با تماس
            مستقیم اعلام می‌شود. برای مراجعه حضوری، گالری فرّه در تهران، مجتمع
            تجاری قیطریه، طبقه همکف قرار دارد.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="contact-actions">
          <a className="contact-action" href="tel:02122696502">
            <Phone size={22} />
            <span>
              <small>شماره تماس</small>
              <strong dir="ltr">021-22696502</strong>
            </span>
          </a>
          <div className="contact-action">
            <MapPin size={22} />
            <span>
              <small>آدرس</small>
              <strong>تهران، مجتمع تجاری قیطریه، طبقه همکف</strong>
            </span>
          </div>
          <a
            className="contact-action"
            href="https://www.instagram.com/farreh_gallery?igsh=MTdpd2l0dmx1OHloYg=="
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={22} />
            <span>
              <small>اینستاگرام</small>
              <strong dir="ltr">farreh_gallery</strong>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function AdminLoginPage({
  onAuthenticated,
  notice,
}: {
  onAuthenticated: (authToken: string) => void;
  notice?: string;
}) {
  const [username, setUsername] = useState("farreh_admin");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !password) {
      setErrorMessage("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await loginAdmin(username, password);
      setErrorMessage("");
      onAuthenticated(response.authToken);
    } catch (error) {
      const apiError = error instanceof PriceApiError ? error : null;

      setErrorMessage(
        apiError?.status === 401
          ? "رمز عبور درست نیست."
          : "امکان بررسی رمز عبور وجود ندارد."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-farreh-ink text-white">
      <section className="section-shell flex min-h-screen items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-md">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-farreh-aqua"
          >
            <Home size={17} />
            صفحه اصلی
          </a>

          <form className="price-editor-card" onSubmit={submitPassword}>
            <div className="mb-6">
              <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-full border border-farreh-aqua/30 bg-farreh-aqua/10 text-farreh-aqua">
                <LockKeyhole size={22} />
              </span>
              <h1 className="text-2xl font-black leading-10">
                ورود به مدیریت قیمت‌ها
              </h1>
              <p className="mt-2 text-sm leading-7 text-farreh-silver/64">
                برای مشاهده و تغییر قیمت محصولات، نام کاربری و رمز عبور را وارد
                کنید.
              </p>
            </div>

            {notice ? (
              <p className="mb-3 rounded-lg border border-farreh-aqua/30 bg-farreh-aqua/10 px-3 py-2 text-sm font-bold text-farreh-aqua">
                {notice}
              </p>
            ) : null}

            <label className="price-editor-field">
              <span>نام کاربری</span>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.currentTarget.value);
                  setErrorMessage("");
                }}
                autoFocus
              />
            </label>

            <label className="price-editor-field mt-5">
              <span>رمز عبور</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  setErrorMessage("");
                }}
              />
            </label>

            {errorMessage ? (
              <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="primary-cta mt-5 w-full"
              disabled={isSubmitting}
            >
              <LockKeyhole size={18} />
              {isSubmitting ? "در حال بررسی" : "ورود"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function PriceEditorPage({
  authToken,
  onLogout,
  onAuthExpired,
}: {
  authToken: string;
  onLogout: () => void;
  onAuthExpired: (message: string) => void;
}) {
  const [draft, setDraft] = useState(defaultPriceState);
  const [savedAt, setSavedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const pricedProducts = useMemo(
    () => applyPriceStateToProducts(products, draft),
    [draft]
  );

  useEffect(() => {
    let isMounted = true;

    const loadPrices = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchPriceState(defaultPriceState);
        if (isMounted) setDraft(response.prices);
      } catch {
        if (isMounted) {
          setErrorMessage(
            "امکان دریافت قیمت‌های ذخیره‌شده وجود ندارد. مقادیر پیش‌فرض نمایش داده شده‌اند."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadPrices();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateGramPrice = (
    field: "gramBuyPriceRial" | "gramSellPriceRial",
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: parsePriceInput(value),
    }));
  };

  const updateProductPrice = (
    productId: string,
    field: "buyPriceRial" | "sellPriceRial",
    value: string
  ) => {
    setDraft((current) => ({
      ...current,
      productPrices: {
        ...current.productPrices,
        [productId]: {
          ...current.productPrices[productId],
          [field]: parsePriceInput(value),
        },
      },
    }));
  };

  const savePrices = async () => {
    setIsSaving(true);
    setSavedAt("");
    setErrorMessage("");
    let shouldResetSaving = true;

    try {
      const response = await savePriceState(
        authToken,
        draft,
        defaultPriceState
      );
      setDraft(response.prices);
      setSavedAt(formatSavedTime(response.updatedAt ?? new Date()));
    } catch (error) {
      const apiError = error instanceof PriceApiError ? error : null;

      if (apiError?.status === 401) {
        shouldResetSaving = false;
        clearAuthToken();
        onAuthExpired("توکن شما نامعتبر شد. دوباره وارد شوید.");
        return;
      }

      setErrorMessage("امکان ذخیره قیمت‌ها وجود ندارد.");
    } finally {
      if (shouldResetSaving) {
        setIsSaving(false);
      }
    }
  };

  const resetPrices = () => {
    setDraft(defaultPriceState);
    setSavedAt("");
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-farreh-ink text-white">
      <section className="section-shell min-h-screen">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-farreh-aqua"
              >
                <Home size={17} />
                صفحه اصلی
              </a>
              <h1 className="mt-5 text-2xl font-black leading-10 sm:text-4xl">
                مدیریت قیمت محصولات
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-farreh-silver/68">
                قیمت‌ها از API خوانده می‌شوند و بعد از ذخیره در SQLite برای همه
                کاربران قابل مشاهده هستند.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="secondary-cta"
                onClick={onLogout}
              >
                <LogOut size={18} />
                خروج
              </button>
              <button
                type="button"
                className="secondary-cta"
                onClick={resetPrices}
              >
                <RotateCcw size={18} />
                بازنشانی
              </button>
              <button
                type="button"
                className="primary-cta"
                onClick={savePrices}
                disabled={isLoading || isSaving}
              >
                <Save size={18} />
                {isSaving ? "در حال ذخیره" : "ذخیره قیمت‌ها"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-5 rounded-lg border border-farreh-aqua/30 bg-farreh-aqua/10 px-4 py-3 text-sm font-bold text-farreh-aqua">
              در حال دریافت قیمت‌ها...
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {savedAt ? (
            <div className="mt-5 rounded-lg border border-farreh-aqua/30 bg-farreh-aqua/10 px-4 py-3 text-sm font-bold text-farreh-aqua">
              قیمت‌ها ساعت {savedAt} در دیتابیس ذخیره شدند.
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="price-editor-field">
              <span>قیمت خرید هر گرم</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatPriceInput(draft.gramBuyPriceRial)}
                onChange={(event) =>
                  updateGramPrice("gramBuyPriceRial", event.currentTarget.value)
                }
              />
            </label>
            <label className="price-editor-field">
              <span>قیمت فروش هر گرم</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatPriceInput(draft.gramSellPriceRial)}
                onChange={(event) =>
                  updateGramPrice(
                    "gramSellPriceRial",
                    event.currentTarget.value
                  )
                }
              />
            </label>
          </div>

          <div className="mt-8 grid gap-4">
            {pricedProducts.map((product) => (
              <article key={product.id} className="price-editor-card">
                <div className="grid gap-4 lg:grid-cols-[7rem_minmax(0,1fr)] lg:items-center">
                  <img
                    src={product.image}
                    alt={product.titleFa}
                    loading="lazy"
                    onError={useFallbackImage}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black text-farreh-aqua">
                          {product.category}
                        </p>
                        <h2 className="mt-1 text-lg font-black leading-8">
                          {product.titleFa}
                        </h2>
                        <p className="text-xs uppercase tracking-[0.18em] text-farreh-silver/45">
                          {product.titleEn}
                        </p>
                      </div>
                      <span className="purity-badge">
                        {formatNumber(product.weightGrams)} گرم
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <label className="price-editor-field compact">
                        <span>قیمت خرید محصول</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatPriceInput(product.buyPriceRial)}
                          onChange={(event) =>
                            updateProductPrice(
                              product.id,
                              "buyPriceRial",
                              event.currentTarget.value
                            )
                          }
                        />
                      </label>
                      <label className="price-editor-field compact">
                        <span>قیمت فروش محصول</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatPriceInput(product.sellPriceRial)}
                          onChange={(event) =>
                            updateProductPrice(
                              product.id,
                              "sellPriceRial",
                              event.currentTarget.value
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const priceState = useSavedPriceState();
  const [authToken, setAuthToken] = useState(() => readAuthToken());
  const [authNotice, setAuthNotice] = useState("");
  const pricedProducts = useMemo(
    () => applyPriceStateToProducts(products, priceState),
    [priceState]
  );
  const routePath =
    typeof window === "undefined" ? "/" : window.location.pathname;

  if (routePath === "/admin/prices") {
    if (!authToken) {
      return (
        <AdminLoginPage
          notice={authNotice}
          onAuthenticated={(token) => {
            writeAuthToken(token);
            setAuthToken(token);
            setAuthNotice("");
          }}
        />
      );
    }

    return (
      <PriceEditorPage
        authToken={authToken}
        onLogout={() => {
          clearAuthToken();
          setAuthToken("");
          setAuthNotice("");
        }}
        onAuthExpired={(message) => {
          clearAuthToken();
          setAuthToken("");
          setAuthNotice(message);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-farreh-ink text-white">
      <Header />
      <Hero priceState={priceState} />
      <PriceStrip priceState={priceState} />
      <ProductsSection pricedProducts={pricedProducts} />
      <PuritySection />
      <ContactSection />
    </main>
  );
}
