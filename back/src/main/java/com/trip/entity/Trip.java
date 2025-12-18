package com.trip.entity;
//여행 기본 정보 엔티티
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.DynamicInsert;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DynamicInsert
public class Trip {
	
	@Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
	
	@Column(nullable = false)
	private String title;
	
	@Column(name="start_date")
	private LocalDate startDate;
	@Column(name="end_date")
	private LocalDate endDate;
	
	private String theme;
	private String country;
	private String city;
	
	@Column(precision = 10, scale = 8) //decimal(10,8)
	private BigDecimal latitude; //MySQL의 Decimal - 자바의 BigDecimal
	@Column(precision = 11, scale = 8) //decimal(11,8)
	private BigDecimal longitude;

	@ColumnDefault("PLANNED") //해당컬럼의 디폴트 값 설정(PLANNED)
	private String status;
	
	//비행정보(Text 타입)
	@Column(name="flight_out_dept")
	private LocalDateTime flightOutDept; 
	@Column(name="flight_out_arr")
	private LocalDateTime flightOutArr; 
	@Column(name="flight_in_dept")
	private LocalDateTime flightInDept;
	@Column(name="flight_in_arr")
	private LocalDateTime flightInArr;
	
	// 이 여행을 생성한 사용자 (N:1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User creator;

    // 이 여행에 참여한 사용자 목록 (다대다 관계의 연결점)
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripParticipant> participants = new ArrayList<>();
    
    // 이 여행에 속한 날짜 목록 (1:N)
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Day> days = new ArrayList<>();

    // 이 여행의 선호도 정보 (1:1)
    @OneToOne(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private TripPreference preference;
    
 // [추가!] TripNote와의 1:N 관계
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripNote> tripNotes = new ArrayList<>();

    // [추가!] TripTip과의 1:N 관계
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripTip> tripTips = new ArrayList<>();
}
