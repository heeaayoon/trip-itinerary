package com.trip.service;

import com.trip.entity.Schedule;
import com.trip.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    // DB에서 꺼낼 때 알아서 날짜순 -> 시간순으로 정렬
    @Transactional(readOnly = true)
    public List<Schedule> getSortedSchedules(UUID tripId) {
        return scheduleRepository.findByDay_Trip_IdOrderByDisplayOrderAscTimeAsc(tripId);
    }

}