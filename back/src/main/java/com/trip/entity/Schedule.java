package com.trip.entity;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

	@Entity
	@Table(name = "schedules")
	@Getter 
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public class Schedule {

		@Id
	    @GeneratedValue
	    @Column(name = "id", columnDefinition = "BINARY(16)")
	    private UUID id;

	    // Day와 연결 (어느 날짜의 일정인지)
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "day_id", nullable = false)
	    private Day day;

	    private LocalTime time; // 시작 시간 "10:00"
	    
	    @Column(name = "time_end")
	    private LocalTime timeEnd; // 종료 시간

	    private String activity; // 장소 이름
	    @Column(columnDefinition = "TEXT")
	    private String description;

	    @Column(columnDefinition = "TEXT")
	    private String tips;
	    private String icon; // 카테고리 (food, coffee...)

	    @Column(precision = 10, scale = 8)
	    private BigDecimal lat;

	    @Column(precision = 11, scale = 8)
	    private BigDecimal lng;

	    private String category;

	    @Enumerated(EnumType.STRING) // Enum 타입을 문자열로 저장
	    @ColumnDefault("'PLANNED'")
	    private ScheduleStatus status; // ENUM 타입 처리

	    @Column(name = "is_ai_generated")
	    @ColumnDefault("0")
	    private boolean isAiGenerated;

	    @Column(name = "is_fixed")
	    @ColumnDefault("0")
	    private boolean isFixed;

	    // 자기 자신을 참조하는 관계
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "original_schedule_id")
	    private Schedule originalSchedule;

	    @Column(name = "display_order")
	    @ColumnDefault("0")
	    private Integer displayOrder;
	}