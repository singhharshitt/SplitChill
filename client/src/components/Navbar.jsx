import logo from '../assets/splitchill.png'
export default function Navbar(){
    return(
        <>
        <div className="space-grotesk flex justify-between mx-12 my-6 items-center rounded-sm  px-5 py-3 text-lg shadow-white backdrop-blur-sm bg-[#FFFFFF] z-20 border-b-black border-b-1 ">
            <div className="">
                <img src={logo} alt="SplitChill" className="h-16 w-auto object-contain cursor-pointer" />
            </div>
            <div className="flex gap-8 text-[var(--color-paper-soft)] text-black">
                <p className="hover:underline cursor-pointer">Features</p>
                <p className='hover:underline cursor-pointer'>How It Works</p>
                <p className='hover:underline cursor-pointer'>Pricing</p>
            </div>
            <div className="flex items-center gap-3 ">
                <p className="text-black">Login</p>
                <p className="rounded-full border border-[rgba(255,255,255,0.22)] bg-[var(--color-paper)] px-4 py-1.5 text-[var(--color-brand)]">Get Started</p>
            </div>
        </div>
        
        </>
    )
}
