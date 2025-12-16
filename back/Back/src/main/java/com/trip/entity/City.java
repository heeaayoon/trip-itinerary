package com.trip.entity;

import java.math.BigDecimal;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cities_list")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //city 추가 시에 id 자동 생성
    private Long id;
    private String city;
    private BigDecimal lat;
    private BigDecimal lng;
    private String country;
    private Long population;
}