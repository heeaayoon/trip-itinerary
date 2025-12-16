package com.trip.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "days")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Day {
	@Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "BINARY(16)")
	private UUID id;
	
	//Trip과 N(days):1(trips)관계
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "trip_id", nullable = false)
	private Trip trip;
	
	@Column(name = "day_number")
    private Integer dayNumber;

    private LocalDate date;

    @Column(name = "day_theme")
    private String dayTheme;

    @Column(name = "weather_forecast", columnDefinition = "TEXT")
    private String weatherForecast;

    @Column(name = "weather_temp", precision = 5, scale = 2)
    private BigDecimal weatherTemp;
    
    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Schedule> schedules = new ArrayList<>();
}