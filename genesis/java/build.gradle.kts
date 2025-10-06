plugins {
    base
}

allprojects {
    group = "io.interrealm.genesis"
    version = "0.0.1-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

tasks.named("build") {
    dependsOn(gradle.includedBuilds.map { it.task(":build") })
}

tasks.named("clean") {
    dependsOn(gradle.includedBuilds.map { it.task(":clean") })
}