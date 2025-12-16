import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-cards';
import SwipeCard from '../SwipeCard';

export default function StepSwipe({ candidates, onSwiperInit, onSlideChange, handleVote }: any) {
  return (
    <div className="absolute inset-0 flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center py-4">
            <div className="w-[300px] h-[450px]">
                <Swiper effect={'cards'}
                        grabCursor={true}
                        modules={[EffectCards]}
                        className="w-full h-full"
                        onSwiper={onSwiperInit}
                        onSlideChange={onSlideChange}>
                {candidates.map((place:any) => (
                    <SwiperSlide key={place.place_id} className="rounded-3xl shadow-lg">
                        <SwipeCard place={place} onVote={handleVote} />
                    </SwiperSlide>
                ))}
                </Swiper>
            </div>
        </div>
        <div className="h-10 bg-white" /> 
    </div>
  )
}
